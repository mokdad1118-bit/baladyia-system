import { NextResponse } from "next/server";
import { isPersistentDatabaseConfigured } from "@/lib/libsql-adapter";
import { getAuthSecret } from "@/lib/auth-secret";

/**
 * فحص جاهزية الإنتاج (Render وغيره) — لا يُرجع أسراراً.
 * GET /api/health
 */
export async function GET() {
  const authSecretConfigured = Boolean(getAuthSecret());
  const databaseUrl = Boolean(process.env.DATABASE_URL?.trim());
  const persistentDatabase = isPersistentDatabaseConfigured();
  return NextResponse.json({
    ok: true,
    authSecretConfigured,
    databaseUrlConfigured: databaseUrl,
    persistentDatabaseConfigured: persistentDatabase,
    databaseMode: persistentDatabase ? "remote-libsql" : "local-file",
    message: authSecretConfigured
      ? "ok"
      : "سر الجلسة غير مضبوط (AUTH_SECRET / NEXTAUTH_SECRET / JWT_SECRET) — غالب سبب Internal Server Error على Vercel.",
  });
}
