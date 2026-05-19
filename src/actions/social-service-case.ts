"use server";

import { createWriteStream } from "node:fs";
import { mkdir } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import path from "node:path";
import { pipeline } from "node:stream/promises";
import { Readable } from "node:stream";
import type { ReadableStream as NodeReadableStream } from "node:stream/web";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { FileKind, SocialServiceCaseStatus, SocialServiceCategory, UserRole } from "@/generated/prisma/enums";
import { db } from "@/lib/db";
import { acceptsForFileKind } from "@/lib/file-validation";
import { MAX_CITIZEN_ATTACHMENT_BYTES } from "@/lib/upload-limits";
import { digitsOnly, isValidWhatsappLength } from "@/lib/phone";
import { nextSocialServiceCaseNumber } from "@/lib/social-service-case-serial";
import { socialServiceCategoryLabelAr, socialServiceStatusLabelAr } from "@/lib/social-service-labels";
import { getStaffToNotify, notifyUsers } from "@/lib/notify";
import { assertStaffCanAccessMunicipality } from "@/lib/municipality-scope";
import { staffCanManageSocialServices } from "@/lib/staff-permissions";
import { writeOperationLog } from "@/lib/operation-log";

export type SubmitSocialServiceCaseState = { error: string } | undefined;

type AttachmentRef = { path: string; originalName: string; mimeType: string; size: number };

function parseBirthDate(raw: string): { ok: true; date: Date } | { ok: false; error: string } {
  const s = raw.trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return { ok: false, error: "يرجى إدخال تاريخ ميلاد صالح." };
  const d = new Date(`${s}T12:00:00.000Z`);
  if (Number.isNaN(d.getTime())) return { ok: false, error: "تاريخ الميلاد غير صالح." };
  const today = new Date();
  today.setHours(23, 59, 59, 999);
  if (d > today) return { ok: false, error: "تاريخ الميلاد لا يمكن أن يكون في المستقبل." };
  return { ok: true, date: d };
}

function parseCategory(raw: unknown): SocialServiceCategory | null {
  const v = String(raw ?? "").trim();
  return (Object.values(SocialServiceCategory) as string[]).includes(v) ? (v as SocialServiceCategory) : null;
}

function safeSuccessReturnPath(raw: unknown): "/citizen/services/returnees" | "/services/returnees" {
  const s = String(raw ?? "").trim();
  if (s === "/citizen/services/returnees" || s === "/services/returnees") return s;
  return "/services/returnees";
}

async function saveImage(file: File): Promise<AttachmentRef> {
  const mime = file.type || "application/octet-stream";
  const v = acceptsForFileKind(FileKind.IMAGE, mime);
  if (!v.ok) throw new Error(v.message ?? "المرفق يجب أن يكون صورة.");
  if (file.size > MAX_CITIZEN_ATTACHMENT_BYTES) throw new Error("حجم الصورة أكبر من الحد المسموح.");
  const outDir = path.join(process.cwd(), "public", "uploads", String(new Date().getUTCFullYear()));
  await mkdir(outDir, { recursive: true });
  const ext = path.extname((file as File & { name?: string }).name || "") || ".img";
  const stored = `${randomUUID()}${ext}`;
  const full = path.join(outDir, stored);
  await pipeline(Readable.fromWeb(file.stream() as unknown as NodeReadableStream), createWriteStream(full));
  return {
    path: `/uploads/${new Date().getUTCFullYear()}/${stored}`,
    originalName: (file as File & { name?: string }).name || "image",
    mimeType: mime,
    size: file.size,
  };
}

export async function submitSocialServiceCase(
  _prev: SubmitSocialServiceCaseState,
  formData: FormData,
): Promise<SubmitSocialServiceCaseState> {
  const session = await auth();
  if (!session?.user || session.user.role !== UserRole.CITIZEN) return { error: "يجب تسجيل الدخول كمواطن." };
  const municipalityId = session.user.municipalityId?.trim();
  if (!municipalityId) return { error: "حسابك غير مرتبط ببلدية." };

  const category = parseCategory(formData.get("category"));
  if (!category) return { error: "نوع الخدمة غير صالح." };
  const returnPath = safeSuccessReturnPath(formData.get("_successReturnPath"));

  const phone = digitsOnly(String(formData.get("phone") ?? ""));
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  if (!isValidWhatsappLength(phone)) return { error: "رقم الهاتف غير صالح (8-15 أرقام)." };
  if (email.length < 5 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { error: "البريد الإلكتروني غير صالح." };

  const files = formData.getAll("attachments").filter((f): f is File => f instanceof File && f.size > 0);
  if (files.length === 0) return { error: "يرجى إرفاق صورة واحدة على الأقل." };
  if (category !== SocialServiceCategory.FAMILY_CENSUS && files.length > 1) {
    return { error: "يسمح بصورة واحدة فقط لهذا القسم." };
  }
  if (category === SocialServiceCategory.FAMILY_CENSUS && files.length > 10) {
    return { error: "الإحصاء العام للعوائل يسمح بحد أقصى 10 صور." };
  }

  const attachments: AttachmentRef[] = [];
  for (const f of files) attachments.push(await saveImage(f));

  const data: Record<string, unknown> = {
    municipalityId,
    category,
    citizenId: session.user.id,
    phone,
    email,
    attachmentsJson: JSON.stringify(attachments),
    caseNumber: await nextSocialServiceCaseNumber(municipalityId),
  };

  if (category === SocialServiceCategory.FAMILY_CENSUS) {
    const husbandFullName = String(formData.get("husbandFullName") ?? "").trim();
    const wifeFullName = String(formData.get("wifeFullName") ?? "").trim();
    const husbandNationalId = digitsOnly(String(formData.get("husbandNationalId") ?? ""));
    const wifeNationalId = digitsOnly(String(formData.get("wifeNationalId") ?? ""));
    const familyBookNumber = digitsOnly(String(formData.get("familyBookNumber") ?? ""));
    const husbandBirth = parseBirthDate(String(formData.get("husbandBirthDate") ?? ""));
    const wifeBirth = parseBirthDate(String(formData.get("wifeBirthDate") ?? ""));
    if (husbandFullName.length < 3 || wifeFullName.length < 3) return { error: "يرجى إدخال الاسم الثلاثي للزوج والزوجة." };
    if (!husbandBirth.ok) return { error: husbandBirth.error };
    if (!wifeBirth.ok) return { error: wifeBirth.error };
    if (husbandNationalId.length < 10 || husbandNationalId.length > 11 || wifeNationalId.length < 10 || wifeNationalId.length > 11) {
      return { error: "الرقم الوطني للزوج والزوجة يجب أن يكون 10 أو 11 رقماً." };
    }
    if (familyBookNumber.length < 3) return { error: "يرجى إدخال رقم دفتر العائلة بشكل صحيح." };
    const dup = await db.socialServiceCase.findFirst({
      where: {
        municipalityId,
        category,
        OR: [{ husbandNationalId }, { wifeNationalId }, { familyBookNumber }],
      },
      select: { id: true },
    });
    if (dup) return { error: "يوجد طلب سابق بنفس الرقم الوطني أو رقم دفتر العائلة في هذا القسم." };
    Object.assign(data, {
      husbandFullName,
      husbandBirthDate: husbandBirth.date,
      husbandNationalId,
      wifeFullName,
      wifeBirthDate: wifeBirth.date,
      wifeNationalId,
      familyBookNumber,
    });
  } else {
    const fullName = String(formData.get("fullName") ?? "").trim();
    const nationalId = digitsOnly(String(formData.get("nationalId") ?? ""));
    const birthDate = parseBirthDate(String(formData.get("birthDate") ?? ""));
    if (fullName.length < 3) return { error: "يرجى إدخال الاسم الثلاثي." };
    if (!birthDate.ok) return { error: birthDate.error };
    if (nationalId.length < 10 || nationalId.length > 11) return { error: "الرقم الوطني يجب أن يكون 10 أو 11 رقماً." };
    const existing = await db.socialServiceCase.findFirst({
      where: { municipalityId, category, nationalId },
      select: { id: true },
    });
    if (existing) return { error: "هذا الرقم الوطني مسجل مسبقاً في نفس القسم." };
    Object.assign(data, { fullName, birthDate: birthDate.date, nationalId });
  }

  const created = await db.socialServiceCase.create({ data: data as never });
  await writeOperationLog({
    session,
    municipalityId,
    action: "CREATE",
    module: "SOCIAL_SERVICES",
    title: "تقديم طلب خدمة اجتماعية",
    description: `تم تقديم طلب ${socialServiceCategoryLabelAr[category]} رقم ${created.caseNumber}`,
    entityType: "SOCIAL_SERVICE_CASE",
    entityId: created.id,
    metadata: { caseNumber: created.caseNumber, category, phone, email, data },
  });

  try {
    const staff = await getStaffToNotify(municipalityId);
    await notifyUsers({
      userIds: staff,
      type: "SOCIAL_SERVICE_SUBMITTED",
      title: `طلب ${socialServiceCategoryLabelAr[category]} جديد`,
      message: `وصل طلب ${created.caseNumber}.`,
      municipalityId,
      socialServiceCaseId: created.id,
    });
    await notifyUsers({
      userIds: [session.user.id],
      type: "SOCIAL_SERVICE_SUBMITTED",
      title: "تم استلام طلب الخدمة الاجتماعية",
      message: `تم استلام طلبك ${created.caseNumber}. الحالة: قيد المعالجة.`,
      municipalityId,
      socialServiceCaseId: created.id,
    });
  } catch (e) {
    console.warn("[submitSocialServiceCase] notifyUsers:", e);
  }

  revalidatePath("/admin/social-services");
  revalidatePath("/notifications");
  revalidatePath("/citizen/notifications");
  revalidatePath("/requests");
  revalidatePath("/citizen/requests");
  revalidatePath("/services/returnees");
  revalidatePath("/citizen/services/returnees");
  redirect(`${returnPath}?ok=1&no=${encodeURIComponent(created.caseNumber)}`);
}

export async function updateSocialServiceCaseStatusAction(
  caseId: string,
  statusRaw: string,
): Promise<{ ok: true } | { error: string }> {
  const session = await auth();
  if (!session?.user || !staffCanManageSocialServices(session)) return { error: "غير مصرح." };
  if (!(Object.values(SocialServiceCaseStatus) as string[]).includes(statusRaw)) return { error: "حالة غير صالحة." };
  const status = statusRaw as SocialServiceCaseStatus;
  const row = await db.socialServiceCase.findFirst({
    where: { id: caseId },
    select: {
      id: true,
      status: true,
      citizenId: true,
      caseNumber: true,
      category: true,
      municipalityId: true,
    },
  });
  if (!row) return { error: "الطلب غير موجود." };
  try {
    assertStaffCanAccessMunicipality(session, row.municipalityId);
  } catch {
    return { error: "غير مصرح." };
  }
  if (row.status === status) return { ok: true };
  await db.socialServiceCase.update({ where: { id: caseId }, data: { status } });
  await writeOperationLog({
    session,
    municipalityId: row.municipalityId,
    action: "UPDATE_STATUS",
    module: "SOCIAL_SERVICES",
    title: "تغيير حالة طلب خدمة اجتماعية",
    description: `تم تغيير حالة الطلب ${row.caseNumber} إلى ${socialServiceStatusLabelAr[status]}`,
    entityType: "SOCIAL_SERVICE_CASE",
    entityId: row.id,
    metadata: { caseNumber: row.caseNumber, category: row.category, fromStatus: row.status, toStatus: status },
  });
  try {
    await notifyUsers({
      userIds: [row.citizenId],
      type: "SOCIAL_SERVICE_STATUS_CHANGE",
      title: `تحديث حالة طلب ${socialServiceCategoryLabelAr[row.category]}`,
      message: `تم تحديث حالة الطلب ${row.caseNumber} إلى: ${socialServiceStatusLabelAr[status]}.`,
      municipalityId: row.municipalityId,
      socialServiceCaseId: row.id,
    });
  } catch (e) {
    console.warn("[updateSocialServiceCaseStatusAction] notifyUsers:", e);
  }
  revalidatePath("/admin/social-services");
  revalidatePath("/notifications");
  revalidatePath("/citizen/notifications");
  revalidatePath("/citizen/requests");
  revalidatePath("/requests");
  return { ok: true };
}
