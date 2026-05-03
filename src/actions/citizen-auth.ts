"use server";

import { cookies } from "next/headers";
import { db } from "@/lib/db";
import { hashPassword } from "@/lib/password";
import {
  citizenPhoneLookupKeys,
  digitsOnly,
  normalizeCitizenPhoneForStorage,
} from "@/lib/phone";
import { OtpPurpose, UserRole } from "@/generated/prisma/enums";
import { parseCitizenRegisterForm, otpCodeSchema } from "@/lib/citizen-auth-schemas";
import { createAndStoreOtp, verifyOtpCode } from "@/lib/citizen-otp";
import { buildArabicOtpEmailBodies, sendCitizenOtpEmail } from "@/lib/mailer";
import {
  CITIZEN_RESET_EMAIL_COOKIE,
  CITIZEN_RESET_TOKEN_COOKIE,
  CITIZEN_VERIFY_EMAIL_COOKIE,
  RESET_EMAIL_COOKIE_MAX_AGE,
  RESET_TOKEN_COOKIE_MAX_AGE,
  VERIFY_COOKIE_MAX_AGE,
} from "@/lib/citizen-auth-cookies";
import { signPasswordResetToken, verifyPasswordResetToken } from "@/lib/citizen-reset-token";
import { z } from "zod";

export type RegisterCitizenState =
  | { error: string }
  | { ok: true; warning?: string }
  | undefined;

const forgotGenericMessage =
  "إن وُجد حساب مرتبط بالبيانات المدخلة، ستصلك رسالة على البريد الإلكتروني المسجّل خلال دقائق.";

async function sendVerificationOtpToEmail(emailNorm: string, code: string) {
  const { textBody, htmlBody } = buildArabicOtpEmailBodies({
    code,
    heading: "رمز تفعيل الحساب",
    intro: "شكراً لتسجيلك في البوابة الإلكترونية لبلدية بصرى. استخدم الرمز التالي لتفعيل حسابك:",
  });
  await sendCitizenOtpEmail({
    to: emailNorm,
    subject: "رمز تفعيل الحساب — بلدية بصرى",
    textBody,
    htmlBody,
  });
}

async function sendPasswordResetOtpToEmail(emailNorm: string, code: string) {
  const { textBody, htmlBody } = buildArabicOtpEmailBodies({
    code,
    heading: "رمز استعادة كلمة المرور",
    intro: "طُلب إعادة تعيين كلمة المرور لحسابك. إذا لم تطلب ذلك، تجاهل الرسالة.",
  });
  await sendCitizenOtpEmail({
    to: emailNorm,
    subject: "رمز استعادة كلمة المرور — بلدية بصرى",
    textBody,
    htmlBody,
  });
}

export async function registerCitizen(
  _prev: RegisterCitizenState,
  formData: FormData,
): Promise<RegisterCitizenState> {
  const parsed = parseCitizenRegisterForm(formData);
  if (!parsed.success) {
    const msg = parsed.error.issues[0]?.message ?? "بيانات غير صالحة";
    return { error: msg };
  }
  const { fullName, email, password, phoneRaw, nationalIdRaw } = parsed.data;
  const nationalId = digitsOnly(nationalIdRaw);
  const phoneDigits = digitsOnly(phoneRaw);
  const phone = normalizeCitizenPhoneForStorage(phoneRaw);

  const phoneVariants = new Set([
    ...citizenPhoneLookupKeys(phoneDigits),
    ...citizenPhoneLookupKeys(phone),
    phone,
  ]);
  for (const p of phoneVariants) {
    if (!p) continue;
    const taken = await db.user.findUnique({ where: { phone: p } });
    if (taken) return { error: "رقم الهاتف مسجّل مسبقاً" };
  }
  const emailTaken = await db.user.findUnique({ where: { email } });
  if (emailTaken) return { error: "البريد الإلكتروني مسجّل مسبقاً" };
  const nidTaken = await db.user.findUnique({ where: { nationalId } });
  if (nidTaken) return { error: "الرقم الوطني مسجّل مسبقاً" };

  try {
    await db.user.create({
      data: {
        name: fullName,
        email,
        phone,
        nationalId,
        passwordHash: await hashPassword(password),
        role: UserRole.CITIZEN,
        isVerified: false,
        notificationEmail: null,
      },
    });
  } catch (e: unknown) {
    const code =
      typeof e === "object" && e !== null && "code" in e ? String((e as { code: unknown }).code) : "";
    if (code === "P2002") {
      return { error: "بريد أو هاتف أو رقم وطني مُستخدم مسبقاً" };
    }
    console.error("[registerCitizen]", e);
    return { error: "تعذّر حفظ الحساب. حاول مرة أخرى." };
  }

  const jar = await cookies();
  jar.set(CITIZEN_VERIFY_EMAIL_COOKIE, email, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: VERIFY_COOKIE_MAX_AGE,
    path: "/",
  });

  try {
    const code = await createAndStoreOtp(email, OtpPurpose.EMAIL_VERIFICATION);
    await sendVerificationOtpToEmail(email, code);
  } catch (e) {
    console.error("[registerCitizen] OTP/email", e);
    const hint =
      e instanceof Error ? e.message : "تعذّر إرسال البريد. استخدم «إعادة إرسال الرمز» بعد ضبط SMTP.";
    return { ok: true, warning: hint };
  }

  return { ok: true };
}

export type SimpleMessageState = { error: string } | { ok: true; message?: string } | undefined;

export async function verifyCitizenEmailAction(
  _prev: SimpleMessageState,
  formData: FormData,
): Promise<SimpleMessageState> {
  const jar = await cookies();
  const email = jar.get(CITIZEN_VERIFY_EMAIL_COOKIE)?.value?.trim().toLowerCase();
  if (!email) return { error: "انتهت الجلسة. أعد التسجيل أو اطلب رمزاً جديداً من البداية." };

  const raw = String(formData.get("code") ?? "");
  const codeParsed = otpCodeSchema.safeParse(raw);
  if (!codeParsed.success) return { error: codeParsed.error.issues[0]?.message ?? "رمز غير صالح" };

  const ok = await verifyOtpCode(email, OtpPurpose.EMAIL_VERIFICATION, codeParsed.data);
  if (!ok) return { error: "الرمز غير صحيح أو منتهي الصلاحية" };

  const u = await db.user.findFirst({
    where: { email, role: UserRole.CITIZEN },
  });
  if (!u) return { error: "لم يُعثَر على الحساب" };
  await db.user.update({ where: { id: u.id }, data: { isVerified: true } });
  jar.delete(CITIZEN_VERIFY_EMAIL_COOKIE);
  return { ok: true, message: "تم تفعيل الحساب بنجاح. يمكنك تسجيل الدخول الآن." };
}

export async function resendVerificationOtpAction(
  _prev: SimpleMessageState,
  _fd: FormData,
): Promise<SimpleMessageState> {
  const jar = await cookies();
  const email = jar.get(CITIZEN_VERIFY_EMAIL_COOKIE)?.value?.trim().toLowerCase();
  if (!email) return { error: "لا توجد جلسة تفعيل نشطة." };
  try {
    const code = await createAndStoreOtp(email, OtpPurpose.EMAIL_VERIFICATION);
    await sendVerificationOtpToEmail(email, code);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "تعذّر إرسال الرمز";
    return { error: msg };
  }
  return { ok: true, message: "أُعيد إرسال الرمز إلى بريدك." };
}

async function findCitizenByEmailOrPhone(identifier: string) {
  const t = identifier.trim();
  if (!t) return null;
  if (t.includes("@")) {
    const email = t.toLowerCase();
    return db.user.findFirst({
      where: { email, role: UserRole.CITIZEN, isActive: true },
    });
  }
  const d = digitsOnly(t);
  if (!d) return null;
  const canonical = normalizeCitizenPhoneForStorage(t);
  const variants = new Set([...citizenPhoneLookupKeys(d), ...citizenPhoneLookupKeys(canonical), canonical]);
  for (const phone of variants) {
    if (!phone) continue;
    const u = await db.user.findFirst({
      where: { phone, role: UserRole.CITIZEN, isActive: true },
    });
    if (u) return u;
  }
  return null;
}

export async function requestPasswordResetAction(
  _prev: SimpleMessageState,
  formData: FormData,
): Promise<SimpleMessageState> {
  const identifier = String(formData.get("identifier") ?? "").trim();
  if (identifier.length < 3) {
    return { ok: true, message: forgotGenericMessage };
  }
  const user = await findCitizenByEmailOrPhone(identifier);
  const jar = await cookies();
  jar.delete(CITIZEN_RESET_EMAIL_COOKIE);
  jar.delete(CITIZEN_RESET_TOKEN_COOKIE);

  if (!user?.email) {
    return { ok: true, message: forgotGenericMessage };
  }

  try {
    const code = await createAndStoreOtp(user.email, OtpPurpose.PASSWORD_RESET);
    await sendPasswordResetOtpToEmail(user.email, code);
  } catch {
    await db.emailOtp.deleteMany({
      where: { email: user.email, purpose: OtpPurpose.PASSWORD_RESET, used: false },
    });
    return { ok: true, message: forgotGenericMessage };
  }

  jar.set(CITIZEN_RESET_EMAIL_COOKIE, user.email, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: RESET_EMAIL_COOKIE_MAX_AGE,
    path: "/",
  });

  return { ok: true, message: forgotGenericMessage };
}

export async function verifyPasswordResetOtpAction(
  _prev: SimpleMessageState,
  formData: FormData,
): Promise<SimpleMessageState> {
  const jar = await cookies();
  const email = jar.get(CITIZEN_RESET_EMAIL_COOKIE)?.value?.trim().toLowerCase();
  if (!email) return { error: "انتهت الجلسة. ابدأ طلب استعادة كلمة المرور من جديد." };

  const raw = String(formData.get("code") ?? "");
  const codeParsed = otpCodeSchema.safeParse(raw);
  if (!codeParsed.success) return { error: codeParsed.error.issues[0]?.message ?? "رمز غير صالح" };

  const ok = await verifyOtpCode(email, OtpPurpose.PASSWORD_RESET, codeParsed.data);
  if (!ok) return { error: "الرمز غير صحيح أو منتهي الصلاحية" };

  const user = await db.user.findFirst({
    where: { email, role: UserRole.CITIZEN, isActive: true },
  });
  if (!user) return { error: "لم يُعثَر على الحساب" };

  const token = signPasswordResetToken(user.id);
  jar.set(CITIZEN_RESET_TOKEN_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: RESET_TOKEN_COOKIE_MAX_AGE,
    path: "/",
  });
  jar.delete(CITIZEN_RESET_EMAIL_COOKIE);
  return { ok: true, message: "تم التحقق. يمكنك اختيار كلمة مرور جديدة." };
}

const newPasswordSchema = z
  .object({
    password: z
      .string()
      .min(8, "كلمة المرور ٨ أحرف على الأقل")
      .max(128)
      .regex(/[A-Za-z]/, "يجب أن تحتوي على حرف إنجليزي")
      .regex(/[0-9]/, "يجب أن تحتوي على رقم"),
    confirm: z.string(),
  })
  .refine((d) => d.password === d.confirm, { message: "تأكيد كلمة المرور غير متطابق", path: ["confirm"] });

export async function resetCitizenPasswordAction(
  _prev: SimpleMessageState,
  formData: FormData,
): Promise<SimpleMessageState> {
  const jar = await cookies();
  const token = jar.get(CITIZEN_RESET_TOKEN_COOKIE)?.value;
  const userId = verifyPasswordResetToken(token);
  if (!userId) return { error: "انتهت صلاحية الجلسة. ابدأ من جديد." };

  const parsed = newPasswordSchema.safeParse({
    password: String(formData.get("password") ?? ""),
    confirm: String(formData.get("confirm") ?? ""),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "بيانات غير صالحة" };
  }

  const user = await db.user.findFirst({
    where: { id: userId, role: UserRole.CITIZEN, isActive: true },
  });
  if (!user) return { error: "لم يُعثَر على الحساب" };

  await db.user.update({
    where: { id: user.id },
    data: { passwordHash: await hashPassword(parsed.data.password) },
  });
  jar.delete(CITIZEN_RESET_TOKEN_COOKIE);
  jar.delete(CITIZEN_RESET_EMAIL_COOKIE);
  return { ok: true, message: "تم تحديث كلمة المرور. يمكنك تسجيل الدخول." };
}

export async function resendPasswordResetOtpAction(
  _prev: SimpleMessageState,
  _fd: FormData,
): Promise<SimpleMessageState> {
  const jar = await cookies();
  const email = jar.get(CITIZEN_RESET_EMAIL_COOKIE)?.value?.trim().toLowerCase();
  if (!email) return { error: "لا توجد جلسة إعادة تعيين نشطة." };
  try {
    const code = await createAndStoreOtp(email, OtpPurpose.PASSWORD_RESET);
    await sendPasswordResetOtpToEmail(email, code);
  } catch (e) {
    return { error: e instanceof Error ? e.message : "تعذّر إرسال الرمز" };
  }
  return { ok: true, message: "أُعيد إرسال الرمز." };
}
