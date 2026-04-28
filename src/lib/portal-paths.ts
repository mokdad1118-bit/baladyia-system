import type { AuthPortal } from "@/lib/auth-portal";

/** نسخة خفيفة بدون استيراد middleware — للاستخدام من العميل */
function staffInternalPathToBrowserPath(internalPath: string): string {
  const path = internalPath.split("?")[0];
  if (!path.startsWith("/admin")) return internalPath;
  if (path === "/admin") return "/";
  const rest = path.slice("/admin".length);
  return rest.startsWith("/") ? rest : `/${rest}`;
}

/** مسارات تطبيق المواطن (محمية أو عامة ضمن نفس الواجهة) */
export function isCitizenAppPath(pathname: string) {
  return (
    pathname === "/" ||
    pathname === "/login" ||
    pathname === "/register" ||
    pathname.startsWith("/services") ||
    pathname.startsWith("/requests") ||
    pathname.startsWith("/notifications")
  );
}

/** صفحات تطبيق المواطن التي يمكن للزائر دخولها دون جلسة */
export function isCitizenPublicPath(pathname: string) {
  return pathname === "/login" || pathname === "/register" || pathname.startsWith("/services");
}

/**
 * بعد تسجيل الدخول: السماح فقط بإعادة التوجيه الداخلية ضمن نفس البوابة
 * (يمنع open redirect عبر query ?next=)
 */
function isStaffPortalBrowserNext(next: string) {
  if (next === "/" || next === "") return true;
  return (
    next.startsWith("/requests") ||
    next.startsWith("/services") ||
    next.startsWith("/users") ||
    next.startsWith("/citizens") ||
    next.startsWith("/stats")
  );
}

/**
 * @param staffPortalWeb — true عند فتح نموذج الدخول على نطاق لوحة التحكم المنفصل (مسارات بدون بادئة /admin)
 */
export function safePostLoginRedirectPath(
  raw: string | null,
  portal: AuthPortal,
  staffPortalWeb?: boolean,
): string | null {
  if (raw == null) return null;
  const next = raw.trim();
  if (!next.startsWith("/") || next.startsWith("//")) return null;
  if (next.includes("\\") || next.includes(":")) return null;
  if (portal === "staff") {
    if (staffPortalWeb) {
      if (next.startsWith("/admin")) return staffInternalPathToBrowserPath(next);
      if (isStaffPortalBrowserNext(next)) return next;
      return null;
    }
    if (next.startsWith("/admin")) return next;
    return null;
  }
  if (isCitizenAppPath(next)) return next;
  return null;
}
