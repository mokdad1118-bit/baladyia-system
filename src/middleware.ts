/**
 * فصل الوصول: مسارات المواطن (/، /login، /services، …) مقابل لوحة التحكم (/admin/*).
 * الجلسة تُقيَّم حسب role؛ لا يوجد دخول مشترك — تسجيل المواطن portal=citizen والموظف portal=staff في Credentials.
 * أسباب الفصل: تجربة مستخدم أوضح، تقليل سطح الهجوم، وسهولة توسيع كل بوابة لاحقاً.
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
  staffPortalSplitEnabled,
} from "@/lib/staff-portal";

function redirectStaffHome(req: NextRequest, hostHeader: string | null) {
  const origin = staffPortalOrigin();
  if (staffPortalSplitEnabled() && !isStaffPortalHostname(hostHeader) && origin) {
    return NextResponse.redirect(new URL("/", `${origin}/`));
  }
  return NextResponse.redirect(new URL(staffPanelHomePath(hostHeader), req.url));
}

function rewriteStaff(req: NextRequest, internalPath: string) {
  const u = req.nextUrl.clone();
  u.pathname = internalPath;
  return NextResponse.rewrite(u);
}

export async function middleware(req: NextRequest) {
  const { pathname, search } = req.nextUrl;
  const host = req.headers.get("host");
  const split = staffPortalSplitEnabled();
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

  const token = await getToken({
    req,
    secret: process.env.AUTH_SECRET,
  });
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
      return redirectToCitizenPortal(req, `/login${search}`);
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
      return redirectStaffHome(req, host);
    }
    if (staffRewriteInternal) {
      return rewriteStaff(req, staffRewriteInternal);
    }
    return NextResponse.next();
  }

  if (!hasSession) {
    const u = new URL("/login", req.url);
    u.searchParams.set("next", pathname + search);
    return NextResponse.redirect(u);
  }
  if (role !== UserRole.CITIZEN) {
    if (role === UserRole.EMPLOYEE || role === UserRole.ADMIN) {
      return redirectStaffHome(req, host);
    }
    return NextResponse.redirect(new URL("/login", req.url));
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
    "/admin/:path*",
    "/users/:path*",
    "/stats/:path*",
  ],
};
