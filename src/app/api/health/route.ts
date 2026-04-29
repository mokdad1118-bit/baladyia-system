import { NextResponse } from "next/server";

/**
 * فحص جاهزية الإنتاج (Render وغيره) — لا يُرجع أسراراً.
 * GET /api/health
 */
export async function GET() {
  const authSecret = Boolean(process.env.AUTH_SECRET?.trim());
  const databaseUrl = Boolean(process.env.DATABASE_URL?.trim());
  return NextResponse.json({
    ok: true,
    authSecretConfigured: authSecret,
    databaseUrlConfigured: databaseUrl,
    message: authSecret
      ? "ok"
      : "AUTH_SECRET غير مضبوط — تسجيل الدخول وواجهات الجلسة ستفشل حتى يُضاف في متغيرات البيئة.",
  });
}
