"use server";

import { mkdir } from "node:fs/promises";
import { createWriteStream } from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { pipeline } from "node:stream/promises";
import { Readable } from "node:stream";
import type { ReadableStream as NodeReadableStream } from "node:stream/web";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { FileKind, ReturneeRegistrationStatus, UserRole } from "@/generated/prisma/enums";
import { db } from "@/lib/db";
import { acceptsForFileKind } from "@/lib/file-validation";
import { getStaffToNotify, notifyUsers } from "@/lib/notify";
import { digitsOnly, isValidWhatsappLength } from "@/lib/phone";
import { nextReturneeRegistrationNumber } from "@/lib/returnee-registration-serial";
import { returneeRegistrationStatusLabelAr } from "@/lib/returnee-registration-labels";
import { MAX_CITIZEN_ATTACHMENT_BYTES } from "@/lib/upload-limits";

export type SubmitReturneeRegistrationState = { error: string } | undefined;

function parseBirthDate(raw: string): { ok: true; date: Date } | { ok: false; error: string } {
  const s = raw.trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) {
    return { ok: false, error: "يرجى إدخال تاريخ ميلاد صالح." };
  }
  const d = new Date(`${s}T12:00:00.000Z`);
  if (Number.isNaN(d.getTime())) {
    return { ok: false, error: "تاريخ الميلاد غير صالح." };
  }
  const today = new Date();
  today.setHours(23, 59, 59, 999);
  if (d > today) {
    return { ok: false, error: "تاريخ الميلاد لا يمكن أن يكون في المستقبل." };
  }
  return { ok: true, date: d };
}

function safeSuccessReturnPath(raw: unknown): "/citizen/services/returnees" | "/services/returnees" {
  const s = String(raw ?? "").trim();
  if (s === "/citizen/services/returnees" || s === "/services/returnees") return s;
  return "/services/returnees";
}

function parseEmail(raw: string): { ok: true; email: string } | { ok: false; error: string } {
  const email = raw.trim().toLowerCase();
  if (email.length < 5 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { ok: false, error: "يرجى إدخال بريد إلكتروني صالح." };
  }
  return { ok: true, email };
}

export async function submitReturneeRegistration(
  _prev: SubmitReturneeRegistrationState,
  formData: FormData,
): Promise<SubmitReturneeRegistrationState> {
  const session = await auth();
  if (!session?.user || session.user.role !== UserRole.CITIZEN) {
    return { error: "يجب تسجيل الدخول كمواطن لتقديم الطلب." };
  }

  const returnPath = safeSuccessReturnPath(formData.get("_successReturnPath"));

  const fullName = String(formData.get("fullName") ?? "").trim();
  const birthParsed = parseBirthDate(String(formData.get("birthDate") ?? ""));
  const phone = digitsOnly(String(formData.get("phone") ?? ""));
  const nationalId = digitsOnly(String(formData.get("nationalId") ?? ""));
  const emailParsed = parseEmail(String(formData.get("email") ?? ""));

  if (fullName.length < 3) return { error: "يرجى إدخال الاسم الثلاثي." };
  if (!birthParsed.ok) return { error: birthParsed.error };
  if (!isValidWhatsappLength(phone)) return { error: "رقم الهاتف غير صالح (أرقام فقط ٨-١٥)." };
  if (nationalId.length < 10 || nationalId.length > 11) {
    return { error: "الرقم الوطني يجب أن يكون 10 أو 11 رقماً." };
  }
  if (!emailParsed.ok) return { error: emailParsed.error };

  const file = formData.get("returnStatement") as File | null;
  if (!file || file.size === 0) {
    return { error: "يرجى إرفاق صورة لبيان العودة." };
  }
  if (file.size > MAX_CITIZEN_ATTACHMENT_BYTES) {
    return {
      error: `حجم الصورة كبير جداً (الحد الأقصى ${Math.round(MAX_CITIZEN_ATTACHMENT_BYTES / (1024 * 1024))} ميغابايت).`,
    };
  }
  const mime = file.type || "application/octet-stream";
  const v = acceptsForFileKind(FileKind.IMAGE, mime);
  if (!v.ok) {
    return { error: v.message ?? "مطلوب ملف صورة لبيان العودة." };
  }

  const outDir = path.join(process.cwd(), "public", "uploads", String(new Date().getUTCFullYear()));
  await mkdir(outDir, { recursive: true });

  const ext =
    path.extname((file as File & { name?: string }).name || "") ||
    (mime === "image/jpeg" || mime === "image/jpg"
      ? ".jpg"
      : mime === "image/png"
        ? ".png"
        : mime === "image/webp"
          ? ".webp"
          : ".img");
  const stored = `${randomUUID()}${ext}`;
  const full = path.join(outDir, stored);
  await pipeline(
    Readable.fromWeb(file.stream() as unknown as NodeReadableStream),
    createWriteStream(full),
  );
  const rel = `/uploads/${new Date().getUTCFullYear()}/${stored}`;

  const number = await nextReturneeRegistrationNumber();
  const created = await db.returneeRegistration.create({
    data: {
      registrationNumber: number,
      citizenId: session.user.id,
      fullName,
      birthDate: birthParsed.date,
      nationalId,
      phone,
      email: emailParsed.email,
      returnStatementPath: rel,
      returnStatementOriginal: (file as File & { name?: string }).name || "image",
      returnStatementMime: mime,
      returnStatementSize: file.size,
    },
  });

  try {
    const staff = await getStaffToNotify();
    await notifyUsers({
      userIds: staff,
      type: "RETURNEE_SUBMITTED",
      title: "طلب تسجيل عائدين جديد",
      message: `وصل طلب تسجيل عائدين رقم ${number} — ${fullName}.`,
      returneeRegistrationId: created.id,
    });
    await notifyUsers({
      userIds: [session.user.id],
      type: "RETURNEE_SUBMITTED",
      title: "تم استلام طلب تسجيل العائدين",
      message: `تم استلام طلبك رقم ${number}. الحالة: قيد المتابعة.`,
      returneeRegistrationId: created.id,
    });
  } catch (e) {
    console.warn("[submitReturneeRegistration] notifyUsers:", e);
  }

  revalidatePath("/admin/returnee-registrations");
  revalidatePath("/admin/social-services");
  revalidatePath("/services/returnees");
  revalidatePath("/citizen/services/returnees");
  revalidatePath("/notifications");
  revalidatePath("/citizen/notifications");
  revalidatePath("/requests");
  revalidatePath("/citizen/requests");
  revalidatePath("/admin");

  redirect(`${returnPath}?ok=1&no=${encodeURIComponent(number)}`);
}

const RETURNEE_STATUS_SET = new Set<string>(Object.values(ReturneeRegistrationStatus));

export async function updateReturneeRegistrationStatusAction(
  registrationId: string,
  statusRaw: string,
): Promise<{ ok: true } | { error: string }> {
  const session = await auth();
  if (!session?.user || session.user.role !== UserRole.ADMIN) {
    return { error: "غير مصرح." };
  }
  if (!RETURNEE_STATUS_SET.has(statusRaw)) {
    return { error: "حالة غير صالحة." };
  }
  const status = statusRaw as ReturneeRegistrationStatus;
  const row = await db.returneeRegistration.findFirst({
    where: { id: registrationId },
    select: {
      id: true,
      status: true,
      citizenId: true,
      registrationNumber: true,
    },
  });
  if (!row) return { error: "الطلب غير موجود." };
  if (row.status === status) return { ok: true };

  await db.returneeRegistration.update({
    where: { id: registrationId },
    data: { status },
  });
  try {
    await notifyUsers({
      userIds: [row.citizenId],
      type: "RETURNEE_STATUS_CHANGE",
      title: "تحديث حالة طلب تسجيل العائدين",
      message: `تم تحديث حالة طلب تسجيل العائدين ${row.registrationNumber} إلى: ${returneeRegistrationStatusLabelAr[status]}.`,
      returneeRegistrationId: row.id,
    });
  } catch (e) {
    console.warn("[updateReturneeRegistrationStatusAction] notifyUsers:", e);
  }

  revalidatePath("/admin/returnee-registrations");
  revalidatePath("/admin/social-services");
  revalidatePath("/notifications");
  revalidatePath("/citizen/notifications");
  revalidatePath("/citizen/requests");
  revalidatePath("/requests");
  return { ok: true };
}
