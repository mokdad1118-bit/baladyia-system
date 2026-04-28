"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogoutForm } from "@/components/LogoutForm";
import { IconBack } from "./citizen-icons";

type Title = { t: string; backHref?: string };

function getTitleForPath(p: string): Title {
  if (p === "/services") return { t: "الخدمات" };
  if (p === "/requests") return { t: "طلباتي" };
  if (p.startsWith("/requests/") && !p.includes("/new/")) {
    return { t: "تفاصيل الطلب", backHref: "/requests" };
  }
  if (p.startsWith("/requests/new/")) {
    return { t: "تقديم طلب", backHref: "/services" };
  }
  if (p.startsWith("/notifications")) return { t: "الإشعارات" };
  if (p === "/") return { t: "الرئيسية" };
  return { t: "تطبيق المواطن" };
}

export function CitizenAppBar() {
  const path = usePathname() ?? "";
  const { t, backHref } = getTitleForPath(path);
  return (
    <div
      className="fixed end-0 start-0 top-0 z-40 border-b border-[var(--gov-border)] bg-white md:hidden"
      style={{ paddingTop: "max(0.25rem, env(safe-area-inset-top))" }}
    >
      <div className="grid min-h-14 w-full max-w-6xl grid-cols-[2.75rem_1fr_2.75rem] items-center gap-0 px-1 pb-0.5 sm:px-2">
        <div className="flex justify-end">
          {backHref ? (
            <Link
              href={backHref}
              className="touch-manipulation inline-flex h-12 w-12 items-center justify-center rounded-sm text-[var(--gov-muted)] transition active:bg-[#f3f5f7]"
              aria-label="رجوع"
            >
              <IconBack className="h-6 w-6" />
            </Link>
          ) : (
            <span className="w-10" aria-hidden />
          )}
        </div>
        <h1 className="min-w-0 truncate text-center text-base font-bold text-[var(--gov-text)]">{t}</h1>
        <div className="flex min-h-10 items-center justify-start">
          <LogoutForm compact className="text-[var(--gov-primary)]" />
        </div>
      </div>
    </div>
  );
}
