/**
 * صفحات الدخول على نفس الدومين:
 * /citizen/welcome ثم /citizen/login للمواطن، /staff/login للموظف، /admin/login للمدير.
 * وكل لوحة محمية حسب role فقط.
 */
import { NextResponse, type NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { UserRole } from "@/generated/prisma/enums";
import { isAdminPanelRole } from "@/lib/roles";
import { isCitizenAppPath, isCitizenPublicPath } from "@/lib/portal-paths";
import { getAuthSecret } from "@/lib/auth-secret";
import { CITIZEN_WELCOME_PASS_COOKIE, CITIZEN_WELCOME_PASS_VALUE } from "@/lib/citizen-welcome-pass";

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
  const secret = getAuthSecret();
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
  /** مرفقات الطلبات: ملفات ثابتة تحت public/uploads — لا تمر على منطق الجلسات/الأدوار. */
  if (pathname.startsWith("/uploads")) return NextResponse.next();
  if (pathname === "/login") {
    const u = req.nextUrl.clone();
    u.pathname = "/citizen/welcome";
    return NextResponse.redirect(u);
  }
  if (pathname === "/employee/login") {
    const u = req.nextUrl.clone();
    u.pathname = "/staff/login";
    return NextResponse.redirect(u);
  }

  const token = await readJwt(req);
  const role = token?.role as UserRole | undefined;
  const hasSession = Boolean(token);
  const employeeHasAdminPerm =
    role === UserRole.EMPLOYEE &&
    Boolean(
      token?.permViewRequests ||
        token?.permManageGas ||
        token?.permManageSocialServices ||
        token?.permManageCitizenFeedback ||
        token?.permViewCitizens ||
        token?.permViewOperationLog ||
        token?.permManageServices ||
        token?.permManageUsers ||
        token?.permViewStats,
    );

  if (pathname === "/admin/login") return NextResponse.next();
  if (pathname.startsWith("/admin")) {
    if (!hasSession) {
      const u = new URL("/admin/login", req.url);
      u.searchParams.set("next", pathname + search);
      return NextResponse.redirect(u);
    }
    if (!isAdminPanelRole(role as UserRole) && !employeeHasAdminPerm) {
      if (role === UserRole.EMPLOYEE) return NextResponse.redirect(new URL("/staff", req.url));
      if (role === UserRole.CITIZEN) return NextResponse.redirect(new URL("/citizen", req.url));
      return NextResponse.redirect(new URL("/citizen/welcome", req.url));
    }
    return NextResponse.next();
  }

  if (pathname === "/staff/login") return NextResponse.next();
  if (pathname.startsWith("/staff")) {
    if (!hasSession) {
      const u = new URL("/staff/login", req.url);
      u.searchParams.set("next", pathname + search);
      return NextResponse.redirect(u);
    }
    if (role !== UserRole.EMPLOYEE) {
      if (isAdminPanelRole(role as UserRole)) return NextResponse.redirect(new URL("/admin", req.url));
      if (role === UserRole.CITIZEN) return NextResponse.redirect(new URL("/citizen", req.url));
      return NextResponse.redirect(new URL("/citizen/welcome", req.url));
    }
    return NextResponse.next();
  }

  if (pathname.startsWith("/gas-agent")) {
    if (!hasSession) {
      const u = new URL("/citizen/welcome", req.url);
      u.searchParams.set("next", pathname + search);
      return NextResponse.redirect(u);
    }
    if (role !== UserRole.GAS_AGENT) {
      if (isAdminPanelRole(role as UserRole)) return NextResponse.redirect(new URL("/admin", req.url));
      if (role === UserRole.EMPLOYEE) return NextResponse.redirect(new URL(employeeHasAdminPerm ? "/admin" : "/staff", req.url));
      if (role === UserRole.CITIZEN) return NextResponse.redirect(new URL("/citizen", req.url));
      return NextResponse.redirect(new URL("/citizen/welcome", req.url));
    }
    return NextResponse.next();
  }

  if (!isCitizenAppPath(pathname)) {
    return NextResponse.next();
  }

  if (isCitizenPublicPath(pathname)) {
    if (pathname === "/citizen/welcome") {
      const requestHeaders = new Headers(req.headers);
      requestHeaders.set("x-welcome-route", "1");
      return NextResponse.next({ request: { headers: requestHeaders } });
    }
    return NextResponse.next();
  }

  if (!hasSession) {
    const u = new URL("/citizen/welcome", req.url);
    u.searchParams.set("next", pathname + search);
    return NextResponse.redirect(u);
  }
  if (role !== UserRole.CITIZEN) {
    if (role === UserRole.GAS_AGENT) return NextResponse.redirect(new URL("/gas-agent", req.url));
    if (role === UserRole.EMPLOYEE) return NextResponse.redirect(new URL(employeeHasAdminPerm ? "/admin" : "/staff", req.url));
    if (isAdminPanelRole(role as UserRole)) return NextResponse.redirect(new URL("/admin", req.url));
    return NextResponse.redirect(new URL("/citizen/welcome", req.url));
  }
  /** بدون كوكي عبور الترحيب لا تُرسَل لوحة المواطن — يُمنع وميض الواجهة قبل شاشة الترحيب */
  const welcomePassOk = req.cookies.get(CITIZEN_WELCOME_PASS_COOKIE)?.value === CITIZEN_WELCOME_PASS_VALUE;
  if (!welcomePassOk) {
    const u = new URL("/citizen/welcome", req.url);
    u.searchParams.set("next", pathname + search);
    return NextResponse.redirect(u);
  }
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/uploads/:path*",
    "/",
    "/login",
    "/citizen/login",
    "/citizen/welcome",
    "/citizen/forgot-password",
    "/citizen/forgot-password/:path*",
    "/staff/login",
    "/admin/login",
    "/register",
    "/register/:path*",
    "/services/:path*",
    "/requests/:path*",
    "/notifications/:path*",
    "/feedback",
    "/feedback/:path*",
    "/citizen",
    "/citizen/:path*",
    "/admin",
    "/staff",
    "/staff/:path*",
    "/gas-agent",
    "/gas-agent/:path*",
    "/admin/:path*",
    "/users/:path*",
    "/citizen-feedback/:path*",
    "/stats/:path*",
  ],
};
