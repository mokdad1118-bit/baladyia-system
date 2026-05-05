"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";

function linkClass(active: boolean) {
  return cn(
    "inline-flex items-center justify-center rounded-full px-3 py-1.5 text-sm font-semibold transition-[color,box-shadow]",
    active
      ? "text-[var(--gov-primary)] ring-2 ring-[var(--gov-primary)] ring-offset-2 ring-offset-white"
      : "text-[var(--gov-primary)] hover:underline",
  );
}

export function CitizenDesktopNavLinks({ isCitizen }: { isCitizen: boolean }) {
  const path = usePathname() ?? "";
  const base: "" | "/citizen" = path.startsWith("/citizen") ? "/citizen" : "";
  const services = `${base}/services`;
  const requests = `${base}/requests`;
  const notifications = `${base}/notifications`;
  const account = `${base}/account`;
  const home = base === "/citizen" ? "/citizen" : "/";

  const activeServices = path === services || path.startsWith(`${services}/`);
  const activeRequests =
    path === requests || (path.startsWith(`${requests}/`) && !path.includes("/new/"));
  const activeNotifications = path === notifications || path.startsWith(`${notifications}/`);
  const activeAccount = path === account || path.startsWith(`${account}/`);
  const activeHome = path === home;

  return (
    <nav className="flex flex-wrap items-center gap-x-3 gap-y-2 text-sm">
      <Link href={services} className={linkClass(activeServices)}>
        الخدمات
      </Link>
      {isCitizen ? (
        <>
          <Link href={requests} className={linkClass(activeRequests)}>
            طلباتي
          </Link>
          <Link href={notifications} className={linkClass(activeNotifications)}>
            الإشعارات
          </Link>
          <Link href={account} className={linkClass(activeAccount)}>
            حسابي
          </Link>
          <Link href={home} className={linkClass(activeHome)}>
            الرئيسية
          </Link>
        </>
      ) : (
        <>
          <Link href="/citizen/login" className="text-[var(--gov-primary)] hover:underline">
            تسجيل الدخول
          </Link>
          <Link
            href={base === "/citizen" ? "/citizen/register" : "/register"}
            className="text-[var(--gov-primary)] hover:underline"
          >
            تسجيل
          </Link>
        </>
      )}
    </nav>
  );
}
