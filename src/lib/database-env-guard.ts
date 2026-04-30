/**
 * فحص بيئة قاعدة البيانات دون استيراد `path`/`url` (يُستورد من instrumentation
 * وقد يُحلَّل ضمن مسارات Webpack لـ PWA).
 */
export function isPersistentDatabaseConfiguredFromEnv(): boolean {
  const raw = process.env.DATABASE_URL?.trim();
  if (!raw) return false;
  return (
    raw.startsWith("libsql://") ||
    raw.startsWith("libsql+") ||
    raw.startsWith("https://")
  );
}
