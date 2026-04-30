import { NextResponse } from "next/server";
import { isPersistentDatabaseConfigured } from "@/lib/libsql-adapter";

/**
 * فحص جاهزية الإنتاج (Render وغيره) — لا يُرجع أسراراً.
 * GET /api/health
 */
export async function GET() {
  const authSecret = Boolean(process.env.AUTH_SECRET?.trim());
  const databaseUrl = Boolean(process.env.DATABASE_URL?.trim());
  const persistentDatabase = isPersistentDatabaseConfigured();
  return NextResponse.json({
    ok: true,
    authSecretConfigured: authSecret,
    databaseUrlConfigured: databaseUrl,
    persistentDatabaseConfigured: persistentDatabase,
    databaseMode: persistentDatabase ? "remote-libsql" : "local-file",
    message: authSecret
      ? "ok"
      : "AUTH_SECRET غير مضبوط — تسجيل الدخول وواجهات الجلسة ستفشل حتى يُضاف في متغيرات البيئة.",
  });
}
