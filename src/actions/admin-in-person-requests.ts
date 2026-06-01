"use server";

import { mkdir } from "node:fs/promises";
import { createWriteStream } from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { pipeline } from "node:stream/promises";
import { Readable } from "node:stream";
import type { ReadableStream as NodeReadableStream } from "node:stream/web";
import type { Session } from "next-auth";
import { revalidatePath } from "next/cache";
import { redirect, unstable_rethrow } from "next/navigation";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { acceptsForFileKind } from "@/lib/file-validation";
import { MAX_CITIZEN_ATTACHMENT_BYTES } from "@/lib/upload-limits";
import { assertStaffCanAccessMunicipality } from "@/lib/municipality-scope";
import { getStaffToNotify, notifyUsers } from "@/lib/notify";
import { digitsOnly, isValidWhatsappLength, notifEmailOrNull } from "@/lib/phone";
import { hashPassword } from "@/lib/password";
import { nextRequestNumber } from "@/lib/request-serial";
import { writeOperationLog } from "@/lib/operation-log";
import { FileKind, RequestStatus, SocialServiceCategory, UserRole } from "@/generated/prisma/enums";
import { nextReturneeRegistrationNumber } from "@/lib/returnee-registration-serial";
import { nextSocialServiceCaseNumber } from "@/lib/social-service-case-serial";
import { socialServiceCategoryLabelAr } from "@/lib/social-service-labels";
import { staffCanManageInPersonRequests } from "@/lib/staff-permissions";

async function defaultAssigneeId(municipalityId: string) {
  const e = await db.user.findFirst({
    where: { isActive: true, role: UserRole.EMPLOYEE, municipalityId },
    orderBy: { createdAt: "asc" },
  });
  return e?.id ?? null;
}

function parseEmail(raw: string): string | null {
  return notifEmailOrNull(raw.trim()) ?? null;
}

async function resolveCitizen(input: {
  municipalityId: string;
  fullName: string;
  phone: string;
  nationalId: string;
  notificationEmail: string | null;
}) {
  const byNationalId = await db.user.findFirst({
    where: { role: UserRole.CITIZEN, nationalId: input.nationalId },
  });
  const byPhone = await db.user.findFirst({
    where: { role: UserRole.CITIZEN, phone: input.phone },
  });
  const existing = byNationalId ?? byPhone;

  if (byNationalId && byPhone && byNationalId.id !== byPhone.id) {
    return { error: "الرقم الوطني ورقم الواتساب مسجلان لحسابين مختلفين." };
  }
  if (existing && existing.municipalityId && existing.municipalityId !== input.municipalityId) {
    return { error: "حساب المواطن مسجل ضمن بلدية أخرى." };
  }

  if (existing) {
    const updated = await db.user.update({
      where: { id: existing.id },
      data: {
        name: input.fullName,
        phone: input.phone,
        nationalId: input.nationalId,
        notificationEmail: input.notificationEmail,
        municipalityId: input.municipalityId,
      },
    });
    return { citizen: updated };
  }

  const passwordHash = await hashPassword(randomUUID());
  const created = await db.user.create({
    data: {
      name: input.fullName,
      phone: input.phone,
      nationalId: input.nationalId,
      notificationEmail: input.notificationEmail,
      passwordHash,
      role: UserRole.CITIZEN,
      isVerified: true,
      isActive: true,
      municipalityId: input.municipalityId,
    },
  });
  return { citizen: created };
}

export async function submitInPersonRequest(
  _p: { error?: string } | undefined,
  formData: FormData,
) {
  try {
    const session = await auth();
    if (session?.user && !staffCanManageInPersonRequests(session)) return { error: "غير مصرح." };
    if (!session?.user) return { error: "يجب تسجيل الدخول." };

    const serviceId = String(formData.get("serviceId") ?? "").trim();
    const fullName = String(formData.get("fullName") ?? "").trim();
    const phone = digitsOnly(String(formData.get("phone") ?? ""));
    const nationalId = digitsOnly(String(formData.get("nationalId") ?? ""));
    const notificationEmailRaw = String(formData.get("notificationEmail") ?? "").trim();
    const notificationEmail = notificationEmailRaw ? parseEmail(notificationEmailRaw) : null;

    if (!serviceId) return { error: "يرجى اختيار الخدمة." };
    if (fullName.length < 2) return { error: "يرجى إدخال اسم المواطن." };
    if (!isValidWhatsappLength(phone)) return { error: "رقم الواتساب غير صالح." };
    if (nationalId.length < 8 || nationalId.length > 20) return { error: "الرقم الوطني غير صالح." };
    if (notificationEmailRaw && !notificationEmail) return { error: "بريد الإشعارات غير صالح." };

    const service = await db.service.findFirst({
      where: { id: serviceId, isActive: true },
      include: { documents: { orderBy: { sortOrder: "asc" } }, municipality: { select: { id: true, name: true } } },
    });
    if (!service) return { error: "الخدمة غير متوفرة." };

    try {
      assertStaffCanAccessMunicipality(session, service.municipalityId);
    } catch {
      return { error: "لا تملك صلاحية إنشاء طلب لهذه البلدية." };
    }

    const resolvedCitizen = await resolveCitizen({
      municipalityId: service.municipalityId,
      fullName,
      phone,
      nationalId,
      notificationEmail,
    });
    if ("error" in resolvedCitizen) return { error: resolvedCitizen.error };

    const outDir = path.join(process.cwd(), "public", "uploads", String(new Date().getUTCFullYear()));
    await mkdir(outDir, { recursive: true });

    const fileRecords: {
      serviceDocumentId: string;
      storedName: string;
      originalName: string;
      mimeType: string;
      size: number;
    }[] = [];

    for (const d of service.documents) {
      const file = formData.get(`file_${d.id}`) as File | null;
      if (d.isRequired && (!file || file.size === 0)) return { error: `مطلوب: ${d.name}` };
      if (!file || file.size === 0) continue;
      if (file.size > MAX_CITIZEN_ATTACHMENT_BYTES) {
        return { error: `${d.name}: حجم الملف كبير جداً.` };
      }
      const mime = file.type || "application/octet-stream";
      const v = acceptsForFileKind(d.fileType, mime);
      if (!v.ok) return { error: `${d.name}: ${v.message}` };

      const ext = path.extname((file as File & { name?: string }).name || "") || (mime === "application/pdf" ? ".pdf" : ".bin");
      const stored = `${randomUUID()}${ext}`;
      await pipeline(
        Readable.fromWeb(file.stream() as unknown as NodeReadableStream),
        createWriteStream(path.join(outDir, stored)),
      );
      fileRecords.push({
        serviceDocumentId: d.id,
        storedName: `/uploads/${new Date().getUTCFullYear()}/${stored}`,
        originalName: (file as File & { name?: string }).name || "file",
        mimeType: mime,
        size: file.size,
      });
    }

    const number = await nextRequestNumber(service.municipalityId);
    const assigneeId = await defaultAssigneeId(service.municipalityId);
    const req = await db.request.create({
      data: {
        municipalityId: service.municipalityId,
        requestNumber: number,
        serviceId: service.id,
        citizenId: resolvedCitizen.citizen.id,
        assigneeId,
        status: RequestStatus.PENDING,
        submittedFullName: fullName,
        submittedPhone: phone,
        submittedNotificationEmail: notificationEmail,
        source: "in_person",
        formPayload: "{}",
        files: { create: fileRecords },
      },
    });

    await writeOperationLog({
      session,
      municipalityId: service.municipalityId,
      action: "CREATE",
      module: "REQUESTS",
      title: "إنشاء طلب حضوري",
      description: `تم إنشاء الطلب الحضوري ${number} للخدمة: ${service.name}`,
      entityType: "REQUEST",
      entityId: req.id,
      requestId: req.id,
      metadata: {
        source: "in_person",
        requestNumber: number,
        serviceId: service.id,
        serviceName: service.name,
        citizenId: resolvedCitizen.citizen.id,
        filesCount: fileRecords.length,
      },
    });

    try {
      await notifyUsers({
        userIds: await getStaffToNotify(service.municipalityId),
        type: "REQUEST_SUBMIT",
        title: "طلب حضوري جديد",
        message: `تم إنشاء طلب حضوري رقم ${number} للخدمة: ${service.name}.`,
        municipalityId: service.municipalityId,
        requestId: req.id,
      });
    } catch (e) {
      console.error("[submitInPersonRequest] notifyUsers failed", e);
    }

    revalidatePath("/admin/requests");
    revalidatePath("/admin/services/in-person");
    redirect(`/admin/requests?source=in_person&success=1&no=${encodeURIComponent(number)}`);
  } catch (e) {
    unstable_rethrow(e);
    console.error("[submitInPersonRequest] failed:", e);
    return { error: "تعذر حفظ الطلب الحضوري حالياً. تحقق من البيانات والمرفقات ثم حاول مرة أخرى." };
  }
}

function parseBirthDate(raw: string): { ok: true; date: Date } | { ok: false; error: string } {
  const s = raw.trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return { ok: false, error: "يرجى إدخال تاريخ ميلاد صالح." };
  const d = new Date(`${s}T12:00:00.000Z`);
  if (Number.isNaN(d.getTime())) return { ok: false, error: "تاريخ الميلاد غير صالح." };
  if (d > new Date()) return { ok: false, error: "تاريخ الميلاد لا يمكن أن يكون في المستقبل." };
  return { ok: true, date: d };
}

async function saveImageAttachment(file: File) {
  const mime = file.type || "application/octet-stream";
  const v = acceptsForFileKind(FileKind.IMAGE, mime);
  if (!v.ok) throw new Error(v.message ?? "المرفق يجب أن يكون صورة.");
  if (file.size > MAX_CITIZEN_ATTACHMENT_BYTES) throw new Error("حجم الصورة أكبر من الحد المسموح.");
  const outDir = path.join(process.cwd(), "public", "uploads", String(new Date().getUTCFullYear()));
  await mkdir(outDir, { recursive: true });
  const ext = path.extname((file as File & { name?: string }).name || "") || ".img";
  const stored = `${randomUUID()}${ext}`;
  await pipeline(
    Readable.fromWeb(file.stream() as unknown as NodeReadableStream),
    createWriteStream(path.join(outDir, stored)),
  );
  return {
    path: `/uploads/${new Date().getUTCFullYear()}/${stored}`,
    originalName: (file as File & { name?: string }).name || "image",
    mimeType: mime,
    size: file.size,
  };
}

function parseCategory(raw: unknown): SocialServiceCategory | null {
  const v = String(raw ?? "").trim();
  return (Object.values(SocialServiceCategory) as string[]).includes(v) ? (v as SocialServiceCategory) : null;
}

const socialServiceTabByCategory: Record<SocialServiceCategory, string> = {
  [SocialServiceCategory.DIVORCED]: "divorced",
  [SocialServiceCategory.WIDOWS]: "widows",
  [SocialServiceCategory.ORPHANS]: "orphans",
  [SocialServiceCategory.DISABILITIES]: "disabilities",
  [SocialServiceCategory.CHRONIC_DISEASES]: "chronic-diseases",
  [SocialServiceCategory.FAMILY_CENSUS]: "family-census",
};

async function requireStaffMunicipality(formData: FormData, session: Session | null) {
  const municipalityId = String(formData.get("municipalityId") ?? "").trim();
  if (!municipalityId) return { error: "يرجى اختيار البلدية." } as const;
  try {
    assertStaffCanAccessMunicipality(session, municipalityId);
  } catch {
    return { error: "لا تملك صلاحية إنشاء طلب لهذه البلدية." } as const;
  }
  return { municipalityId } as const;
}

export async function submitInPersonReturneeRegistration(
  _p: { error?: string } | undefined,
  formData: FormData,
) {
  try {
    const session = await auth();
    if (!session?.user) return { error: "يجب تسجيل الدخول." };
    if (session?.user && !staffCanManageInPersonRequests(session)) return { error: "غير مصرح." };
    const scope = await requireStaffMunicipality(formData, session);
    if ("error" in scope) return { error: scope.error };

    const fullName = String(formData.get("fullName") ?? "").trim();
    const birthParsed = parseBirthDate(String(formData.get("birthDate") ?? ""));
    const nationalId = digitsOnly(String(formData.get("nationalId") ?? ""));
    const phone = digitsOnly(String(formData.get("phone") ?? ""));
    const emailRaw = String(formData.get("email") ?? "").trim();
    const email = parseEmail(emailRaw);
    if (fullName.length < 3) return { error: "يرجى إدخال الاسم الثلاثي." };
    if (!birthParsed.ok) return { error: birthParsed.error };
    if (nationalId.length < 10 || nationalId.length > 11) return { error: "الرقم الوطني غير صالح." };
    if (!isValidWhatsappLength(phone)) return { error: "رقم الواتساب غير صالح." };
    if (!email) return { error: "البريد الإلكتروني غير صالح." };

    const file = formData.get("returnStatement") as File | null;
    if (!file || file.size === 0) return { error: "يرجى إرفاق صورة بيان العودة." };
    const saved = await saveImageAttachment(file);

    const citizen = await resolveCitizen({
      municipalityId: scope.municipalityId,
      fullName,
      phone,
      nationalId,
      notificationEmail: email,
    });
    if ("error" in citizen) return { error: citizen.error };

    const number = await nextReturneeRegistrationNumber(scope.municipalityId);
    const created = await db.returneeRegistration.create({
      data: {
        municipalityId: scope.municipalityId,
        registrationNumber: number,
        citizenId: citizen.citizen.id,
        fullName,
        birthDate: birthParsed.date,
        nationalId,
        phone,
        email,
        returnStatementPath: saved.path,
        returnStatementOriginal: saved.originalName,
        returnStatementMime: saved.mimeType,
        returnStatementSize: saved.size,
        source: "in_person",
      },
    });

    await writeOperationLog({
      session,
      municipalityId: scope.municipalityId,
      action: "CREATE",
      module: "SOCIAL_SERVICES",
      title: "إنشاء طلب عائدين حضوري",
      description: `تم إنشاء طلب عائدين حضوري رقم ${number}`,
      entityType: "RETURNEE_REGISTRATION",
      entityId: created.id,
      metadata: { source: "in_person", registrationNumber: number, nationalId, phone },
    });

    revalidatePath("/admin/social-services");
    revalidatePath("/admin/services/in-person");
    redirect(`/admin/social-services?tab=returnees&municipalityId=${encodeURIComponent(scope.municipalityId)}`);
  } catch (e) {
    unstable_rethrow(e);
    console.error("[submitInPersonReturneeRegistration] failed", e);
    return { error: "تعذر حفظ طلب العائدين الحضوري." };
  }
}

export async function submitInPersonSocialServiceCase(
  _p: { error?: string } | undefined,
  formData: FormData,
) {
  try {
    const session = await auth();
    if (!session?.user) return { error: "يجب تسجيل الدخول." };
    if (session?.user && !staffCanManageInPersonRequests(session)) return { error: "غير مصرح." };
    const scope = await requireStaffMunicipality(formData, session);
    if ("error" in scope) return { error: scope.error };
    const category = parseCategory(formData.get("category"));
    if (!category) return { error: "نوع الخدمة غير صالح." };

    const phone = digitsOnly(String(formData.get("phone") ?? ""));
    const emailRaw = String(formData.get("email") ?? "").trim();
    const email = parseEmail(emailRaw);
    if (!isValidWhatsappLength(phone)) return { error: "رقم الواتساب غير صالح." };
    if (!email) return { error: "البريد الإلكتروني غير صالح." };

    const files = formData.getAll("attachments").filter((f): f is File => f instanceof File && f.size > 0);
    if (files.length === 0) return { error: "يرجى إرفاق صورة واحدة على الأقل." };
    if (category !== SocialServiceCategory.FAMILY_CENSUS && files.length > 1) return { error: "يسمح بصورة واحدة فقط لهذا القسم." };
    if (category === SocialServiceCategory.FAMILY_CENSUS && files.length > 10) return { error: "يسمح بحد أقصى 10 صور." };
    const attachments = [];
    for (const f of files) attachments.push(await saveImageAttachment(f));

    const caseNumber = await nextSocialServiceCaseNumber(scope.municipalityId);
    const data: Record<string, unknown> = {
      municipalityId: scope.municipalityId,
      category,
      phone,
      email,
      attachmentsJson: JSON.stringify(attachments),
      caseNumber,
      source: "in_person",
    };

    let citizenFullName = "";
    let citizenNationalId = "";
    if (category === SocialServiceCategory.FAMILY_CENSUS) {
      const husbandFullName = String(formData.get("husbandFullName") ?? "").trim();
      const wifeFullName = String(formData.get("wifeFullName") ?? "").trim();
      const husbandNationalId = digitsOnly(String(formData.get("husbandNationalId") ?? ""));
      const wifeNationalId = digitsOnly(String(formData.get("wifeNationalId") ?? ""));
      const familyBookNumber = digitsOnly(String(formData.get("familyBookNumber") ?? ""));
      const husbandBirth = parseBirthDate(String(formData.get("husbandBirthDate") ?? ""));
      const wifeBirth = parseBirthDate(String(formData.get("wifeBirthDate") ?? ""));
      if (husbandFullName.length < 3 || wifeFullName.length < 3) return { error: "يرجى إدخال أسماء الزوج والزوجة." };
      if (!husbandBirth.ok) return { error: husbandBirth.error };
      if (!wifeBirth.ok) return { error: wifeBirth.error };
      if (husbandNationalId.length < 10 || husbandNationalId.length > 11 || wifeNationalId.length < 10 || wifeNationalId.length > 11) {
        return { error: "الرقم الوطني للزوج والزوجة غير صالح." };
      }
      if (familyBookNumber.length < 3) return { error: "رقم دفتر العائلة غير صالح." };
      Object.assign(data, {
        husbandFullName,
        husbandBirthDate: husbandBirth.date,
        husbandNationalId,
        wifeFullName,
        wifeBirthDate: wifeBirth.date,
        wifeNationalId,
        familyBookNumber,
      });
      citizenFullName = husbandFullName;
      citizenNationalId = husbandNationalId;
    } else {
      const fullName = String(formData.get("fullName") ?? "").trim();
      const nationalId = digitsOnly(String(formData.get("nationalId") ?? ""));
      const birthDate = parseBirthDate(String(formData.get("birthDate") ?? ""));
      if (fullName.length < 3) return { error: "يرجى إدخال الاسم الثلاثي." };
      if (!birthDate.ok) return { error: birthDate.error };
      if (nationalId.length < 10 || nationalId.length > 11) return { error: "الرقم الوطني غير صالح." };
      Object.assign(data, { fullName, birthDate: birthDate.date, nationalId });
      citizenFullName = fullName;
      citizenNationalId = nationalId;
    }

    const citizen = await resolveCitizen({
      municipalityId: scope.municipalityId,
      fullName: citizenFullName,
      phone,
      nationalId: citizenNationalId,
      notificationEmail: email,
    });
    if ("error" in citizen) return { error: citizen.error };
    data.citizenId = citizen.citizen.id;

    const created = await db.socialServiceCase.create({ data: data as never });
    await writeOperationLog({
      session,
      municipalityId: scope.municipalityId,
      action: "CREATE",
      module: "SOCIAL_SERVICES",
      title: "إنشاء طلب خدمة اجتماعية حضوري",
      description: `تم إنشاء طلب ${socialServiceCategoryLabelAr[category]} حضوري رقم ${caseNumber}`,
      entityType: "SOCIAL_SERVICE_CASE",
      entityId: created.id,
      metadata: { source: "in_person", caseNumber, category },
    });

    revalidatePath("/admin/social-services");
    revalidatePath("/admin/services/in-person");
    redirect(`/admin/social-services?tab=${encodeURIComponent(socialServiceTabByCategory[category])}&municipalityId=${encodeURIComponent(scope.municipalityId)}`);
  } catch (e) {
    unstable_rethrow(e);
    console.error("[submitInPersonSocialServiceCase] failed", e);
    return { error: "تعذر حفظ طلب الخدمة الاجتماعية الحضوري." };
  }
}
