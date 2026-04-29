"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogoutForm } from "@/components/LogoutForm";
import { StateEmblem } from "@/components/gov/StateEmblem";
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

export function CitizenAppBar({ isCitizen }: { isCitizen: boolean }) {
  const path = usePathname() ?? "";
  const { t, backHref } = getTitleForPath(path);
  const onCitizenPath = path.startsWith("/citizen");
  const homeHref = onCitizenPath ? "/citizen" : "/";
  const loginHref = "/citizen/login";

  return (
    <div
      className="fixed end-0 start-0 top-0 z-40 border-b border-[var(--gov-border)] bg-white md:hidden"
      style={{ paddingTop: "max(0.25rem, env(safe-area-inset-top))" }}
    >
      <div className="gov-divider-flag mx-auto max-w-6xl opacity-60" aria-hidden />
      <div className="mx-auto grid w-full max-w-6xl grid-cols-[2.75rem_1fr_2.75rem] items-center gap-1 px-1 pb-1 pt-0.5 sm:gap-2 sm:px-2">
        <div className="flex justify-end">
          {backHref ? (
            <Link
              href={backHref}
              className="touch-manipulation inline-flex h-11 w-11 items-center justify-center rounded-sm text-[var(--gov-muted)] transition active:bg-[#f3f5f7]"
              aria-label="رجوع"
            >
              <IconBack className="h-6 w-6" />
            </Link>
          ) : (
            <span className="w-10 shrink-0" aria-hidden />
          )}
        </div>
        <div className="flex min-w-0 items-center justify-center gap-2">
          <Link
            href={homeHref}
            className="shrink-0 touch-manipulation rounded-sm outline-none ring-offset-2 focus-visible:ring-2 focus-visible:ring-[var(--gov-primary)]"
            aria-label="الرئيسية — شعار الدولة"
          >
            <StateEmblem height={36} />
          </Link>
          <h1 className="min-w-0 truncate text-center text-sm font-bold leading-tight text-[var(--gov-text)] sm:text-base">
            {t}
          </h1>
        </div>
        <div className="flex min-h-10 items-center justify-start">
          {isCitizen ? (
            <LogoutForm compact className="text-[var(--gov-primary)]" />
          ) : (
            <Link
              href={loginHref}
              className="touch-manipulation text-xs font-semibold text-[var(--gov-primary)] underline-offset-2 hover:underline sm:text-sm"
            >
              دخول
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
