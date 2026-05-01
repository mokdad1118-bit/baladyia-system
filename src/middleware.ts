/**
 * ثلاث صفحات دخول على نفس الدومين:
 * /citizen/login للمواطن، /staff/login للموظف، /admin/login للمدير.
 * وكل لوحة محمية حسب role فقط.
 */
import { NextResponse, type NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { UserRole } from "@/generated/prisma/enums";
import { isCitizenAppPath, isCitizenPublicPath } from "@/lib/portal-paths";

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
  /** مرفقات الطلبات: ملفات ثابتة تحت public/uploads — لا تمر على منطق الجلسات/الأدوار. */
  if (pathname.startsWith("/uploads")) return NextResponse.next();
  if (pathname === "/login") {
    const u = req.nextUrl.clone();
    u.pathname = "/citizen/login";
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

  if (pathname === "/admin/login") return NextResponse.next();
  if (pathname.startsWith("/admin")) {
    if (!hasSession) {
      const u = new URL("/admin/login", req.url);
      u.searchParams.set("next", pathname + search);
      return NextResponse.redirect(u);
    }
    if (role !== UserRole.ADMIN) {
      if (role === UserRole.EMPLOYEE) return NextResponse.redirect(new URL("/staff", req.url));
      if (role === UserRole.CITIZEN) return NextResponse.redirect(new URL("/citizen", req.url));
      return NextResponse.redirect(new URL("/citizen/login", req.url));
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
      if (role === UserRole.ADMIN) return NextResponse.redirect(new URL("/admin", req.url));
      if (role === UserRole.CITIZEN) return NextResponse.redirect(new URL("/citizen", req.url));
      return NextResponse.redirect(new URL("/citizen/login", req.url));
    }
    return NextResponse.next();
  }

  if (!isCitizenAppPath(pathname)) {
    return NextResponse.next();
  }

  if (isCitizenPublicPath(pathname)) return NextResponse.next();

  if (!hasSession) {
    const u = new URL("/citizen/login", req.url);
    u.searchParams.set("next", pathname + search);
    return NextResponse.redirect(u);
  }
  if (role !== UserRole.CITIZEN) {
    if (role === UserRole.EMPLOYEE) return NextResponse.redirect(new URL("/staff", req.url));
    if (role === UserRole.ADMIN) return NextResponse.redirect(new URL("/admin", req.url));
    return NextResponse.redirect(new URL("/citizen/login", req.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/uploads/:path*",
    "/",
    "/login",
    "/citizen/login",
    "/staff/login",
    "/admin/login",
    "/register",
    "/services/:path*",
    "/requests/:path*",
    "/notifications/:path*",
    "/citizen",
    "/citizen/:path*",
    "/admin",
    "/staff",
    "/staff/:path*",
    "/admin/:path*",
    "/users/:path*",
    "/stats/:path*",
  ],
};
