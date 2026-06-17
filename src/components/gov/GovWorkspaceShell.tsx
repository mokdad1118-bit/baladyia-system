"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { StateEmblem } from "@/components/gov/StateEmblem";
import { ENTITY_NAME_AR, PORTAL_SUBTITLE, SUPERVISING_AUTHORITY_AR } from "@/lib/entity";
import { LogoutForm } from "@/components/LogoutForm";
import { NavigationWaitGate } from "@/components/NavigationWaitGate";
import { cn } from "@/lib/cn";

export function GovWorkspaceShell({
  portalTitle,
  nav,
  children,
  homeHref = "/admin",
  logoutCallbackUrl,
  headerContextLabel,
}: {
  portalTitle: string;
  nav: ReactNode;
  children: ReactNode;
  homeHref?: string;
  logoutCallbackUrl?: string;
  headerContextLabel?: string | null;
}) {
  const [navOpen, setNavOpen] = useState(true);

  return (
    <NavigationWaitGate className="gov-pattern-bg min-h-dvh">
      <header className="gov-header sticky top-0 z-50">
        <div className="mx-auto flex max-w-[96rem] flex-wrap items-center justify-between gap-3 px-4 py-3">
          <Link href={homeHref} prefetch={false} className="flex items-center gap-3 no-underline">
            <StateEmblem height={62} />
            <div className="text-start text-white">
              <p className="text-[0.65rem] text-white/75">{PORTAL_SUBTITLE}</p>
              <p className="text-sm font-bold leading-tight">{ENTITY_NAME_AR}</p>
              <p className="text-[0.65rem] text-white/75">{SUPERVISING_AUTHORITY_AR}</p>
              <p className="text-xs text-white/85">{portalTitle}</p>
            </div>
          </Link>
          <div className="flex items-center gap-2">
            {headerContextLabel ? (
              <span className="max-w-[45vw] truncate rounded-lg border border-white/25 bg-white/10 px-3 py-1.5 text-sm font-semibold text-white/95">
                {headerContextLabel}
              </span>
            ) : null}
            <button
              type="button"
              className="rounded-lg border border-white/25 px-3 py-1.5 text-sm font-semibold text-white/90 transition hover:bg-white/10 hover:text-white"
              onClick={() => setNavOpen((v) => !v)}
              aria-expanded={navOpen}
              aria-controls="admin-side-nav"
            >
              {navOpen ? "إغلاق القائمة" : "فتح القائمة"}
            </button>
            <LogoutForm
              callbackUrl={logoutCallbackUrl}
              className="text-white/90 hover:bg-white/10 hover:text-white"
            />
          </div>
        </div>
        <div className="gov-divider-flag gov-divider-flag--full mx-auto max-w-[96rem] opacity-80" aria-hidden />
      </header>
      <div className="mx-auto flex max-w-[96rem] flex-col gap-6 px-4 py-8 lg:flex-row lg:items-start">
        <aside
          id="admin-side-nav"
          className={cn(
            "gov-card w-full overflow-hidden p-0 lg:sticky lg:top-24 lg:max-h-[calc(100dvh-7rem)] lg:w-56 lg:shrink-0",
            !navOpen && "hidden",
          )}
        >
          <p className="gov-aside-title">القائمة</p>
          <div className="max-h-[65dvh] overflow-y-auto overscroll-contain px-1 pb-2 lg:max-h-[calc(100dvh-10.5rem)]">
            {nav}
          </div>
        </aside>
        <div className="min-w-0 flex-1">{children}</div>
      </div>
    </NavigationWaitGate>
  );
}
