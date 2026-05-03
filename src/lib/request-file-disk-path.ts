import path from "node:path";

/** يحوّل قيمة `storedName` في قاعدة البيانات إلى مسار ملف آمن تحت `public/uploads`. */
export function resolveRequestUploadPath(storedName: string): { ok: true; abs: string } | { ok: false } {
  const key = storedName.trim();
  if (!key || key.startsWith("http://") || key.startsWith("https://")) {
    return { ok: false };
  }
  const rel = key.replace(/^\/+/, "");
  const publicRoot = path.resolve(process.cwd(), "public");
  const abs = path.resolve(publicRoot, rel);
  const uploadsRoot = path.resolve(publicRoot, "uploads");
  if (!abs.startsWith(uploadsRoot + path.sep) && abs !== uploadsRoot) {
    return { ok: false };
  }
  return { ok: true, abs };
}

/** رابط عام للملفات المخزّنة كمسار تحت الموقع (للتوافق مع البيانات القديمة). */
export function requestAttachmentPublicHref(storedName: string): string {
  const key = storedName.trim();
  if (!key) return "#";
  if (key.startsWith("http://") || key.startsWith("https://")) return key;
  return key.startsWith("/") ? key : `/${key}`;
}
