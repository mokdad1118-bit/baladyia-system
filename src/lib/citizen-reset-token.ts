import { createHmac, timingSafeEqual } from "node:crypto";
import { getAuthSecret } from "@/lib/auth-secret";

const PREFIX = "v1";
const TTL_SEC = 15 * 60;

function secret(): string {
  return getAuthSecret() ?? "dev-only-change-me";
}

/** رمز موقّع قصير العمر يُسمح به بعد التحقق من OTP لاستعادة كلمة المرور */
export function signPasswordResetToken(userId: string): string {
  const exp = Math.floor(Date.now() / 1000) + TTL_SEC;
  const payload = `${PREFIX}.${userId}.${exp}`;
  const sig = createHmac("sha256", secret()).update(payload).digest("base64url");
  return `${payload}.${sig}`;
}

export function verifyPasswordResetToken(token: string | undefined): string | null {
  if (!token?.trim()) return null;
  const parts = token.split(".");
  if (parts.length !== 4 || parts[0] !== PREFIX) return null;
  const [p0, userId, expStr, sig] = parts;
  if (p0 !== PREFIX) return null;
  const exp = Number(expStr);
  if (!Number.isFinite(exp) || exp < Math.floor(Date.now() / 1000)) return null;
  const payload = `${PREFIX}.${userId}.${expStr}`;
  const expected = createHmac("sha256", secret()).update(payload).digest("base64url");
  try {
    const a = Buffer.from(sig);
    const b = Buffer.from(expected);
    if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  } catch {
    return null;
  }
  return userId;
}
