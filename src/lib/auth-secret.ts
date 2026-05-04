/**
 * سرّ الجلسة لـ NextAuth / Auth.js — يجب ضبط واحد على الأقل في الإنتاج (مثلاً Vercel → Environment).
 * الترتيب: AUTH_SECRET ثم NEXTAUTH_SECRET ثم JWT_SECRET.
 */
export function getAuthSecret(): string | undefined {
  const a = process.env.AUTH_SECRET?.trim();
  if (a) return a;
  const n = process.env.NEXTAUTH_SECRET?.trim();
  if (n) return n;
  return process.env.JWT_SECRET?.trim() || undefined;
}
