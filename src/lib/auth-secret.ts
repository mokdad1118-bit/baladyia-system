/** يدعم NextAuth (AUTH_SECRET) أو الاسم البديل JWT_SECRET كما في المواصفات */
export function getAuthSecret(): string | undefined {
  const a = process.env.AUTH_SECRET?.trim();
  if (a) return a;
  return process.env.JWT_SECRET?.trim() || undefined;
}
