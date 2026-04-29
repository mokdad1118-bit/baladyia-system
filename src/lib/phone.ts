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

/**
 * توحيد تخزين رقم واتساب (سوريا): 09xxxxxxxx أو 9xxxxxxxx → 9639xxxxxxxx
 * حتى يطابق الدخول لاحقاً حتى لو أدخل المستخدم صيغة مختلفة عن التسجيل.
 */
export function normalizeCitizenPhoneForStorage(raw: string): string {
  const d = digitsOnly(raw);
  if (!d) return d;
  if (/^9639\d{8}$/.test(d)) return d;
  if (d.startsWith("09") && d.length === 10) return `963${d.slice(1)}`;
  if (/^9\d{8}$/.test(d)) return `963${d}`;
  return d;
}

/** أشكال مفتاح phone في الجدول لنفس الرقم (محلي / دولي / بلا صفر أول). */
export function citizenPhoneLookupKeys(digits: string): string[] {
  const keys = new Set<string>();
  if (!digits) return [];
  keys.add(digits);
  if (digits.startsWith("963") && digits.length >= 11) {
    keys.add(`0${digits.slice(3)}`);
  }
  if (digits.startsWith("0") && digits.length >= 10) {
    keys.add(`963${digits.slice(1)}`);
  }
  if (/^9\d{8,9}$/.test(digits)) {
    keys.add(`963${digits}`);
    keys.add(`0${digits}`);
  }
  return [...keys];
}
