/** الحد الأقصى لحجم كل مرفق في طلب المواطن (بايت) — يُستخدم في الخادم والواجهة */
export const MAX_CITIZEN_ATTACHMENT_BYTES = 5 * 1024 * 1024;

export function maxCitizenAttachmentLabelAr(): string {
  return "٥ ميغابايت";
}
