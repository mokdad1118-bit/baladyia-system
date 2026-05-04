/**
 * يُنفَّذ مرة عند تشغيل خادم Node (بما فيه الإنتاج).
 * @see https://nextjs.org/docs/app/guides/instrumentation
 */
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  if (process.env.NODE_ENV !== "production") return;
  const { isPersistentDatabaseConfiguredFromEnv } = await import(
    "@/lib/database-env-guard"
  );
  const { getAuthSecret } = await import("@/lib/auth-secret");
  if (!getAuthSecret()) {
    console.error(
      "[eportal] سر الجلسة مفقود في الإنتاج — عيّن AUTH_SECRET أو NEXTAUTH_SECRET أو JWT_SECRET (مثلاً Vercel → Environment). بدونها يظهر Internal Server Error عند فتح الموقع.",
    );
  }
  if (!isPersistentDatabaseConfiguredFromEnv()) {
    console.error(
      "[eportal] DATABASE_URL غير مضبوط لقاعدة بعيدة (LibSQL/Turso) — يجري استخدام ملف SQLite محلي داخل الحاوية وقد تفقد البيانات بعد إعادة التشغيل.",
    );
  }
}
