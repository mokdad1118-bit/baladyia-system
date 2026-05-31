"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";

function linkClass(active: boolean) {
  return cn(
    "inline-flex min-h-10 items-center justify-center rounded-full px-4 py-2 text-sm font-semibold transition-[color,box-shadow,transform,background-color] duration-300 ease-out",
    active
      ? "scale-[1.02] text-[var(--gov-primary)] shadow-[0_2px_10px_-2px_rgba(18,74,56,0.12),0_8px_24px_-8px_rgba(18,74,56,0.12),inset_0_1px_0_rgba(255,255,255,0.92)] ring-1 ring-[var(--gov-primary)]/45 ring-offset-[3px] ring-offset-[var(--gov-page-bg)] bg-gradient-to-b from-white to-emerald-50/55"
      : "text-[var(--gov-muted)] hover:text-[var(--gov-primary)] hover:bg-emerald-50/45 hover:shadow-[0_2px_10px_-4px_rgba(18,74,56,0.08)]",
  );
}

export function CitizenDesktopNavLinks({
  isCitizen,
  unreadNotifications = 0,
  unreadAreaNews = 0,
}: {
  isCitizen: boolean;
  unreadNotifications?: number;
  unreadAreaNews?: number;
}) {
  const path = usePathname() ?? "";
  const base: "" | "/citizen" = path.startsWith("/citizen") ? "/citizen" : "";
  const services = `${base}/services`;
  const news = `${base}/news`;
  const requests = `${base}/requests`;
  const notifications = `${base}/notifications`;
  const feedback = `${base}/feedback`;
  const account = `${base}/account`;
  const home = base === "/citizen" ? "/citizen" : "/";

  const activeServices = path === services || path.startsWith(`${services}/`);
  const activeNews = path === news || path.startsWith(`${news}/`);
  const activeRequests =
    path === requests || (path.startsWith(`${requests}/`) && !path.includes("/new/"));
  const activeNotifications = path === notifications || path.startsWith(`${notifications}/`);
  const activeFeedback = path === feedback || path.startsWith(`${feedback}/`);
  const activeAccount = path === account || path.startsWith(`${account}/`);
  const activeHome = path === home;

  return (
    <nav className="flex flex-wrap items-center gap-x-3 gap-y-2 text-sm">
      <Link href={services} className={linkClass(activeServices)}>
        الخدمات
      </Link>
      {isCitizen ? (
        <>
          <Link href={news} className={linkClass(activeNews)}>
            {unreadAreaNews > 0 ? `أخبار المنطقة (${unreadAreaNews})` : "أخبار المنطقة"}
          </Link>
          <Link href={requests} className={linkClass(activeRequests)}>
            طلباتي
          </Link>
          <Link href={notifications} className={linkClass(activeNotifications)}>
            {unreadNotifications > 0 ? `الإشعارات (${unreadNotifications})` : "الإشعارات"}
          </Link>
          <Link href={account} className={linkClass(activeAccount)}>
            حسابي
          </Link>
          <Link href={feedback} className={linkClass(activeFeedback)}>
            الشكاوي والمقترحات
          </Link>
          <Link href={home} className={linkClass(activeHome)}>
            الرئيسية
          </Link>
        </>
      ) : (
        <>
          <Link href="/citizen/welcome" className="text-[var(--gov-primary)] hover:underline">
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
