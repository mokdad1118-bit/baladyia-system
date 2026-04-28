"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogoutForm } from "@/components/LogoutForm";
import { IconBack } from "./citizen-icons";

type Title = { t: string; backHref?: string };

function getTitleForPath(p: string): Title {
  const c = p.startsWith("/citizen") ? p.slice("/citizen".length) || "/" : p;
  if (c === "/services") return { t: "الخدمات" };
  if (c === "/requests") return { t: "طلباتي" };
  if (c.startsWith("/requests/") && !c.includes("/new/")) {
    return {
      t: "تفاصيل الطلب",
      backHref: p.startsWith("/citizen") ? "/citizen/requests" : "/requests",
    };
  }
  if (c.startsWith("/requests/new/")) {
    return {
      t: "تقديم طلب",
      backHref: p.startsWith("/citizen") ? "/citizen/services" : "/services",
    };
  }
  if (c.startsWith("/notifications")) return { t: "الإشعارات" };
  if (c === "/" || c === "") return { t: "الرئيسية" };
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
