import type { NextRequest } from "next/server";

/** يحدّه الـ middleware: بدون هذا الكوكي يُوجَّه المواطن إلى /citizen/welcome قبل لوحة التطبيق */
export const CITIZEN_WELCOME_PASS_COOKIE = "citizen_welcome_pass";
export const CITIZEN_WELCOME_PASS_VALUE = "1";

function useSecureCookies(req: NextRequest): boolean {
  if (process.env.NODE_ENV === "production") return true;
  const xf = req.headers.get("x-forwarded-proto")?.split(",")[0]?.trim().toLowerCase();
  if (xf === "https") return true;
  return req.nextUrl.protocol === "https:";
}

export function buildWelcomePassSetCookie(req: NextRequest): string {
  const secure = useSecureCookies(req);
  const parts = [
    `${CITIZEN_WELCOME_PASS_COOKIE}=${CITIZEN_WELCOME_PASS_VALUE}`,
    "Path=/",
    "Max-Age=604800",
    "SameSite=Lax",
  ];
  if (secure) parts.push("Secure");
  return parts.join("; ");
}

export function buildWelcomePassClearCookie(req: NextRequest): string {
  const secure = useSecureCookies(req);
  const parts = [`${CITIZEN_WELCOME_PASS_COOKIE}=`, "Path=/", "Max-Age=0", "SameSite=Lax"];
  if (secure) parts.push("Secure");
  return parts.join("; ");
}

export async function grantCitizenWelcomePassClient(): Promise<void> {
  await fetch(`${window.location.origin}/api/citizen/welcome-pass`, {
    method: "POST",
    credentials: "include",
  });
}

/** إرسال خلفيّاً عند الإغلاق حتى لا يُضاع الطلب */
export function clearCitizenWelcomePassBeacon(): void {
  void fetch(`${window.location.origin}/api/citizen/welcome-pass`, {
    method: "DELETE",
    credentials: "include",
    keepalive: true,
  });
}

export async function clearCitizenWelcomePassClient(): Promise<void> {
  await fetch(`${window.location.origin}/api/citizen/welcome-pass`, {
    method: "DELETE",
    credentials: "include",
  });
}
