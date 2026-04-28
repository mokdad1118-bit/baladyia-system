const MIN = 8;
const MAX = 15;

/** أرقام فقط لاعتمادها كمفتاح فريد (واتساب). */
export function digitsOnly(input: string): string {
  // Normalize Arabic-Indic and Eastern Arabic-Indic digits from mobile keyboards.
  const normalized = input
    .replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - "٠".charCodeAt(0)))
    .replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - "۰".charCodeAt(0)));
  return normalized.replace(/\D/g, "");
}

export function isValidWhatsappLength(d: string): boolean {
  return d.length >= MIN && d.length <= MAX;
}

export function notifEmailOrNull(raw: string): string | null {
  const t = raw.trim().toLowerCase();
  if (!t) return null;
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(t)) return null;
  return t;
}
