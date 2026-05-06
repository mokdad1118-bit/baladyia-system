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
import { FileKind, UserRole } from "@/generated/prisma/enums";
import { db } from "@/lib/db";
import { acceptsForFileKind } from "@/lib/file-validation";
import { digitsOnly, isValidWhatsappLength } from "@/lib/phone";
import { nextReturneeRegistrationNumber } from "@/lib/returnee-registration-serial";
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
  await db.returneeRegistration.create({
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

  revalidatePath("/admin/returnee-registrations");
  revalidatePath("/services/returnees");
  revalidatePath("/citizen/services/returnees");

  redirect(`${returnPath}?ok=1&no=${encodeURIComponent(number)}`);
}
