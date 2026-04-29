/**
 * فصل الوصول: مسارات المواطن (/، /citizen/login، /services، …) مقابل لوحة التحكم (/admin/*).
 * الجلسة تُقيَّم حسب role؛ صفحتا دخول: مواطن (/citizen/login) وموظف (/admin/login) مع حقل credentials.loginPage.
 */
import { NextResponse, type NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { UserRole } from "@/generated/prisma/enums";
import { isCitizenAppPath, isCitizenPublicPath } from "@/lib/portal-paths";
import {
  isStaffPortalHostname,
  redirectToCitizenPortal,
  redirectToStaffPortalFromCitizen,
  staffBrowserPathToInternalPathname,
  staffInternalPathToBrowserPath,
  staffLoginRedirectUrl,
  staffPanelHomePath,
  staffPortalOrigin,
  staffPortalSplitDisabledForOrigin,
  staffPortalSplitEnabled,
} from "@/lib/staff-portal";

function redirectStaffHome(req: NextRequest, hostHeader: string | null, splitEffective: boolean) {
  const origin = staffPortalOrigin();
  if (splitEffective && !isStaffPortalHostname(hostHeader) && origin) {
    return NextResponse.redirect(new URL("/", `${origin}/`));
  }
  return NextResponse.redirect(new URL(staffPanelHomePath(hostHeader), req.url));
}

function rewriteStaff(req: NextRequest, internalPath: string) {
  const u = req.nextUrl.clone();
  u.pathname = internalPath;
  return NextResponse.rewrite(u);
}

/**
 * يجب أن يطابق اسم كوكي الجلسة ما يضبطه NextAuth (`useSecureCookies`).
 * في الإنتاج: `__Secure-authjs.session-token` — وإن مرّرنا secureCookie: false يبقى getToken
 * يبحث عن `authjs.session-token` فلا يجد الكوكي → لا جلسة في الـ middleware بينما `auth()` يراها
 * → حلقة إعادة توجيه بين /citizen/login والجلسة.
 */
function sessionCookieSecure(req: NextRequest): boolean {
  if (process.env.NODE_ENV === "production") return true;
  const xf = req.headers.get("x-forwarded-proto")?.split(",")[0]?.trim().toLowerCase();
  if (xf === "https") return true;
  return req.nextUrl.protocol === "https:";
}

/** بدون AUTH_SECRET أو عند فشل فك التشفير لا نرمي استثناءً يعطل الصفحات الثابتة */
async function readJwt(req: NextRequest) {
  const secret = process.env.AUTH_SECRET?.trim();
  if (!secret) return null;
  try {
    return await getToken({
      req,
      secret,
      secureCookie: sessionCookieSecure(req),
    });
  } catch {
    return null;
  }
}

export async function middleware(req: NextRequest) {
  const { pathname, search } = req.nextUrl;
  if (pathname === "/login") {
    const u = req.nextUrl.clone();
    u.pathname = "/citizen/login";
    return NextResponse.redirect(u);
  }
  const host = req.headers.get("host");
  const splitRaw = staffPortalSplitEnabled();
  const splitDisabled =
    splitRaw && staffPortalSplitDisabledForOrigin(req.nextUrl.origin, host);
  const split = splitRaw && !splitDisabled;
  const onStaffHost = isStaffPortalHostname(host);

  if (split && !onStaffHost && pathname.startsWith("/admin")) {
    return redirectToStaffPortalFromCitizen(req, pathname + search);
  }

  if (split && onStaffHost && pathname.startsWith("/admin")) {
    return NextResponse.redirect(new URL(staffInternalPathToBrowserPath(pathname) + search, req.url));
  }

  let staffRewriteInternal: string | null = null;
  let staffInternal: string | null = null;
  if (split && onStaffHost) {
    staffInternal = staffBrowserPathToInternalPathname(pathname);
    if (staffInternal == null) {
      return redirectToCitizenPortal(req, pathname + search);
    }
    if (staffInternal !== pathname) {
      staffRewriteInternal = staffInternal;
    }
  }

  const adminPathname =
    split && onStaffHost ? staffInternal : pathname.startsWith("/admin") ? pathname : null;

  const token = await readJwt(req);
  const role = token?.role as UserRole | undefined;
  const hasSession = Boolean(token);

  if (adminPathname) {
    if (adminPathname === "/admin/login") {
      if (role === UserRole.EMPLOYEE || role === UserRole.ADMIN) {
        return NextResponse.redirect(new URL(staffPanelHomePath(host), req.url));
      }
      if (role === UserRole.CITIZEN) {
        return redirectToCitizenPortal(req, "/" + search);
      }
      if (staffRewriteInternal) {
        return rewriteStaff(req, staffRewriteInternal);
      }
      return NextResponse.next();
    }

    if (!hasSession) {
      return NextResponse.redirect(staffLoginRedirectUrl(req, host, adminPathname, search));
    }
    if (role !== UserRole.EMPLOYEE && role !== UserRole.ADMIN) {
      if (role === UserRole.CITIZEN) {
        return redirectToCitizenPortal(req, "/" + search);
      }
      return redirectToCitizenPortal(req, `/citizen/login${search}`);
    }

    if (staffRewriteInternal) {
      return rewriteStaff(req, staffRewriteInternal);
    }
    return NextResponse.next();
  }

  if (!isCitizenAppPath(pathname)) {
    if (staffRewriteInternal) {
      return rewriteStaff(req, staffRewriteInternal);
    }
    return NextResponse.next();
  }

  if (isCitizenPublicPath(pathname)) {
    if (role === UserRole.EMPLOYEE || role === UserRole.ADMIN) {
      return redirectStaffHome(req, host, split);
    }
    if (staffRewriteInternal) {
      return rewriteStaff(req, staffRewriteInternal);
    }
    return NextResponse.next();
  }

  if (!hasSession) {
    const u = new URL("/citizen/login", req.url);
    u.searchParams.set("next", pathname + search);
    return NextResponse.redirect(u);
  }
  if (role !== UserRole.CITIZEN) {
    if (role === UserRole.EMPLOYEE || role === UserRole.ADMIN) {
      return redirectStaffHome(req, host, split);
    }
    return NextResponse.redirect(new URL("/citizen/login", req.url));
  }
  if (staffRewriteInternal) {
    return rewriteStaff(req, staffRewriteInternal);
  }
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/",
    "/login",
    "/register",
    "/services/:path*",
    "/requests/:path*",
    "/notifications/:path*",
    "/citizen",
    "/citizen/:path*",
    "/admin/:path*",
    "/users/:path*",
    "/stats/:path*",
  ],
};
