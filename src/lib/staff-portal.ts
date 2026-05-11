import { NextResponse, type NextRequest } from "next/server";

/** اسم المضيف فقط (بدون منفذ)، مثل admin.localhost */
export function configuredAdminPortalHost(): string | undefined {
  const h = process.env.ADMIN_PORTAL_HOST?.trim().toLowerCase();
  return h || undefined;
}

/** تفعيل فصل لوحة التحكم عن تطبيق المواطن */
export function staffPortalSplitEnabled(): boolean {
  return Boolean(configuredAdminPortalHost());
}

/**
 * يعطّل منطق «فصل النطاقات» عند إعداد خاطئ شائع على Render:
 * `NEXT_PUBLIC_STAFF_PORTAL_URL` يشير لنفس أصل الموقع الحالي، أو
 * `ADMIN_PORTAL_HOST` = المضيف الحالي بدون رابط موظفين منفصل —
 * وإلا يُحوَّل /admin إلى /citizen/login ويختفي دخول الإدارة من مسار المواطن.
 */
export function staffPortalSplitDisabledForOrigin(
  requestOrigin: string,
  hostHeader: string | null | undefined,
): boolean {
  if (!configuredAdminPortalHost()) return false;
  let ro: URL;
  try {
    ro = new URL(requestOrigin);
  } catch {
    return false;
  }
  const cur = (hostHeader ?? "").split(":")[0]?.toLowerCase() ?? "";
  const stf = staffPortalOrigin();
  const cit = citizenPortalOrigin();

  const sameOrigin = (base: string | undefined): boolean => {
    if (!base?.trim()) return false;
    try {
      return new URL(base.trim()).origin === ro.origin;
    } catch {
      return false;
    }
  };

  if (stf && sameOrigin(stf)) {
    if (!cit || sameOrigin(cit)) return true;
  }
  if (!stf && cur === configuredAdminPortalHost()) return true;
  return false;
}

/** أصل الطلب من رؤوس Next (خادم فقط) */
export function requestOriginFromHeaders(h: Headers): string {
  const xfHost = h.get("x-forwarded-host")?.split(",")[0]?.trim();
  const host = xfHost || h.get("host") || "localhost";
  const xfProto = h.get("x-forwarded-proto")?.split(",")[0]?.trim().toLowerCase();
  const proto =
    xfProto === "http" || xfProto === "https"
      ? xfProto
      : host.startsWith("localhost") || host.startsWith("127.")
        ? "http"
        : "https";
  return `${proto}://${host}`;
}

export function isStaffPortalHostname(hostHeader: string | null | undefined): boolean {
  const cfg = configuredAdminPortalHost();
  if (!cfg) return false;
  const host = (hostHeader ?? "").split(":")[0].toLowerCase();
  return host === cfg;
}

/** أصل URL علني لبوابة الموظفين (مثال: http://admin.localhost:3000) */
export function staffPortalOrigin(): string | undefined {
  const o = process.env.NEXT_PUBLIC_STAFF_PORTAL_URL?.trim();
  return o ? o.replace(/\/$/, "") : undefined;
}

/** أصل بوابة المواطن لإعادة التوجيه من نطاق لوحة التحكم */
export function citizenPortalOrigin(): string | undefined {
  const o = process.env.NEXT_PUBLIC_CITIZEN_PORTAL_URL?.trim();
  return o ? o.replace(/\/$/, "") : undefined;
}

/** /admin/foo → /foo على نطاق لوحة التحكم؛ /admin → / */
export function staffInternalPathToBrowserPath(internalPath: string): string {
  const path = internalPath.split("?")[0];
  if (!path.startsWith("/admin")) return internalPath;
  if (path === "/admin") return "/";
  const rest = path.slice("/admin".length);
  return rest.startsWith("/") ? rest : `/${rest}`;
}

/**
 * مسارات المتصفح على نطاق لوحة التحكم → المسار الداخلي في التطبيق (/admin/...).
 * يعيد null لمسارات لا تخص لوحة التحكم (تُحوَّل إلى بوابة المواطن).
 */
export function staffBrowserPathToInternalPathname(pathname: string): string | null {
  if (pathname.startsWith("/api") || pathname.startsWith("/_next")) return null;
  if (pathname.startsWith("/admin")) return pathname;
  const allowed =
    pathname === "/" ||
    pathname === "/login" ||
    pathname.startsWith("/requests") ||
    pathname.startsWith("/social-services") ||
    pathname.startsWith("/returnee-registrations") ||
    pathname.startsWith("/services") ||
    pathname.startsWith("/users") ||
    pathname.startsWith("/citizens") ||
    pathname.startsWith("/stats");
  if (!allowed) return null;
  if (pathname === "/" || pathname === "") return "/admin";
  return `/admin${pathname}`;
}

/** إعادة توجيه من نطاق المواطن عند زيارة /admin?... */
export function redirectToStaffPortalFromCitizen(req: NextRequest, pathnameWithSearch: string): NextResponse {
  const [p, ...rest] = pathnameWithSearch.split("?");
  const qs = rest.length ? `?${rest.join("?")}` : "";
  const browserPath = staffInternalPathToBrowserPath(p);
  const origin = staffPortalOrigin();
  if (origin) {
    const tail = browserPath === "/" ? "/" : browserPath;
    const u = new URL(`${origin.replace(/\/$/, "")}${tail}${qs}`);
    return NextResponse.redirect(u);
  }
  const u = new URL(req.url);
  u.hostname = configuredAdminPortalHost()!;
  u.pathname = browserPath;
  u.search = qs;
  return NextResponse.redirect(u);
}

/** إعادة توجيه من نطاق لوحة التحكم إلى بوابة المواطن */
export function redirectToCitizenPortal(req: NextRequest, pathnameWithSearch: string): NextResponse {
  const origin = citizenPortalOrigin();
  if (origin?.startsWith("http")) {
    const base = origin.replace(/\/$/, "");
    const u = new URL(`${base}${pathnameWithSearch.startsWith("/") ? pathnameWithSearch : `/${pathnameWithSearch}`}`);
    return NextResponse.redirect(u);
  }
  return NextResponse.redirect(new URL(pathnameWithSearch, req.url));
}

export function staffLoginRedirectUrl(
  req: NextRequest,
  hostHeader: string | null,
  internalPathname: string,
  search: string,
): URL {
  const onStaff = isStaffPortalHostname(hostHeader);
  const browserPath = onStaff ? staffInternalPathToBrowserPath(internalPathname) : internalPathname;
  const nextParam = browserPath + search;
  if (onStaff) {
    const u = new URL("/login", req.url);
    u.searchParams.set("next", nextParam);
    return u;
  }
  const u = new URL("/admin/login", req.url);
  u.searchParams.set("next", nextParam);
  return u;
}

/** للاستخدام من مكوّنات الخادم والـ server actions */
export function staffUnauthenticatedLoginPath(hostHeader: string | null | undefined, nextInternal: string): string {
  const onStaff = isStaffPortalHostname(hostHeader);
  const nextParam = onStaff ? staffInternalPathToBrowserPath(nextInternal) : nextInternal;
  if (onStaff) {
    return `/login?next=${encodeURIComponent(nextParam)}`;
  }
  return `/admin/login?next=${encodeURIComponent(nextParam)}`;
}

export function staffPanelHomePath(hostHeader: string | null | undefined): string {
  return isStaffPortalHostname(hostHeader) ? "/" : "/admin";
}

/** تحويل مسار إعادة التوجيه بعد إجراءات الخادم من /admin/... إلى مسار المتصفح على نطاق الموظفين */
export function staffActionRedirectPath(
  hostHeader: string | null | undefined,
  internalPathWithQuery: string,
  requestOrigin?: string,
): string {
  if (!staffPortalSplitEnabled()) return internalPathWithQuery;
  if (requestOrigin && staffPortalSplitDisabledForOrigin(requestOrigin, hostHeader)) {
    return internalPathWithQuery;
  }
  const [path, ...q] = internalPathWithQuery.split("?");
  const qs = q.length ? `?${q.join("?")}` : "";
  if (isStaffPortalHostname(hostHeader)) {
    return `${staffInternalPathToBrowserPath(path)}${qs}`;
  }
  return internalPathWithQuery;
}
