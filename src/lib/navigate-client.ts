/**
 * تنقل كامل النافذة بعد تسجيل الدخول.
 * عند فشل تحميل سابق قد يعرض Chrome سياقًا مثل `chrome-error:`؛
 * `window.location.assign` منه يُرفض («Unsafe attempt to load URL … from frame …»).
 */
export function navigateTopLevel(url: string): void {
  if (typeof window === "undefined") return;
  const proto = window.location.protocol;
  if (proto === "http:" || proto === "https:") {
    window.location.assign(url);
    return;
  }
  const root = document.body ?? document.documentElement;
  const a = document.createElement("a");
  a.href = url;
  a.target = "_top";
  a.rel = "noopener noreferrer";
  a.style.display = "none";
  root.appendChild(a);
  a.click();
  a.remove();
}
