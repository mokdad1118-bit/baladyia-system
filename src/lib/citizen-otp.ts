import { createHmac, randomInt } from "node:crypto";
import { db } from "@/lib/db";
import { OtpPurpose } from "@/generated/prisma/enums";
import { getAuthSecret } from "@/lib/auth-secret";

const OTP_TTL_MS = 10 * 60 * 1000;
const RESEND_COOLDOWN_MS = 60 * 1000;

function pepper(): string {
  return getAuthSecret() ?? "dev-only-change-me";
}

export function hashCitizenOtp(emailNorm: string, purpose: OtpPurpose, code: string): string {
  return createHmac("sha256", pepper())
    .update(`${emailNorm}|${purpose}|${code}`)
    .digest("hex");
}

export function generateSixDigitOtp(): string {
  return String(randomInt(0, 1_000_000)).padStart(6, "0");
}

export async function assertOtpResendAllowed(emailNorm: string, purpose: OtpPurpose): Promise<void> {
  const last = await db.emailOtp.findFirst({
    where: { email: emailNorm, purpose },
    orderBy: { createdAt: "desc" },
    select: { createdAt: true },
  });
  if (!last) return;
  const elapsed = Date.now() - last.createdAt.getTime();
  if (elapsed < RESEND_COOLDOWN_MS) {
    const waitSec = Math.ceil((RESEND_COOLDOWN_MS - elapsed) / 1000);
    throw new Error(`يرجى الانتظار ${waitSec} ثانية قبل طلب رمز جديد.`);
  }
}

/** إبطال الرموز السابقة غير المستخدمة لنفس الغرض */
export async function invalidateOpenOtps(emailNorm: string, purpose: OtpPurpose): Promise<void> {
  await db.emailOtp.updateMany({
    where: { email: emailNorm, purpose, used: false },
    data: { used: true },
  });
}

export async function createAndStoreOtp(emailNorm: string, purpose: OtpPurpose): Promise<string> {
  await assertOtpResendAllowed(emailNorm, purpose);
  await invalidateOpenOtps(emailNorm, purpose);
  const code = generateSixDigitOtp();
  const codeHash = hashCitizenOtp(emailNorm, purpose, code);
  const expiresAt = new Date(Date.now() + OTP_TTL_MS);
  await db.emailOtp.create({
    data: {
      email: emailNorm,
      codeHash,
      purpose,
      expiresAt,
    },
  });
  return code;
}

export async function verifyOtpCode(
  emailNorm: string,
  purpose: OtpPurpose,
  codeRaw: string,
): Promise<boolean> {
  const code = codeRaw.replace(/\D/g, "").trim();
  if (code.length !== 6) return false;
  const expectedHash = hashCitizenOtp(emailNorm, purpose, code);
  const row = await db.emailOtp.findFirst({
    where: {
      email: emailNorm,
      purpose,
      used: false,
      expiresAt: { gt: new Date() },
      codeHash: expectedHash,
    },
    orderBy: { createdAt: "desc" },
  });
  if (!row) return false;
  await db.emailOtp.update({ where: { id: row.id }, data: { used: true } });
  return true;
}
