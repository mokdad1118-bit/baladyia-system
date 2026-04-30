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
  if (!process.env.AUTH_SECRET?.trim()) {
    console.error(
      "[eportal] AUTH_SECRET مفقود في الإنتاج — NextAuth يعيد خطأ Configuration حتى يُضبط على المستضيف (مثلاً Render → Environment).",
    );
  }
  if (!isPersistentDatabaseConfiguredFromEnv()) {
    console.error(
      "[eportal] DATABASE_URL غير مضبوط لقاعدة بعيدة (LibSQL/Turso) — يجري استخدام ملف SQLite محلي داخل الحاوية وقد تفقد البيانات بعد إعادة التشغيل.",
    );
  }
}
