import path from "node:path";

/** يحوّل قيمة `storedName` في قاعدة البيانات إلى مسار ملف آمن تحت `public/uploads`. */
export function resolveRequestUploadPath(storedName: string): { ok: true; abs: string } | { ok: false } {
  const key = storedName.trim();
  if (!key || key.startsWith("http://") || key.startsWith("https://")) {
    return { ok: false };
  }
  let rel = key.replace(/^\/+/, "").replace(/\\/g, "/");
  if (rel.startsWith("public/")) {
    rel = rel.slice("public/".length);
  }
  const segments = rel.split("/").filter(Boolean);
  if (segments.some((s) => s === "..")) {
    return { ok: false };
  }
  if (!segments.length || segments[0] !== "uploads") {
    return { ok: false };
  }
  const publicRoot = path.resolve(process.cwd(), "public");
  const abs = path.resolve(publicRoot, ...segments);
  const uploadsRoot = path.resolve(publicRoot, "uploads");
  if (!abs.startsWith(uploadsRoot + path.sep) && abs !== uploadsRoot) {
    return { ok: false };
  }
  return { ok: true, abs };
}

/** رابط عام للملفات المخزّنة كمسار تحت الموقع (للتوافق مع البيانات القديمة). */
export function requestAttachmentPublicHref(storedName: string): string {
  const key = storedName.trim().replace(/\\/g, "/");
  if (!key) return "#";
  if (key.startsWith("http://") || key.startsWith("https://")) return key;
  const withSlash = key.startsWith("/") ? key : `/${key}`;
  return withSlash;
}
