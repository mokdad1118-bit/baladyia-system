import type { ReactNode } from "react";
import Link from "next/link";
import { StateEmblem } from "@/components/gov/StateEmblem";
import { ENTITY_NAME_AR, PORTAL_SUBTITLE, SUPERVISING_AUTHORITY_AR } from "@/lib/entity";
import { LogoutForm } from "@/components/LogoutForm";
import { NavigationWaitGate } from "@/components/NavigationWaitGate";

export function GovWorkspaceShell({
  portalTitle,
  nav,
  children,
  homeHref = "/admin",
  logoutCallbackUrl,
}: {
  portalTitle: string;
  nav: ReactNode;
  children: ReactNode;
  /** على نطاق لوحة التحكم المنفصل يكون عادةً `/` */
  homeHref?: string;
  logoutCallbackUrl?: string;
}) {
  return (
    <NavigationWaitGate className="min-h-dvh">
      <header className="gov-header">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3">
          <Link href={homeHref} prefetch={false} className="flex items-center gap-3 no-underline">
            <StateEmblem height={62} />
            <div className="text-start text-white">
              <p className="text-[0.65rem] text-white/75">{PORTAL_SUBTITLE}</p>
              <p className="text-sm font-bold leading-tight">{ENTITY_NAME_AR}</p>
              <p className="text-[0.65rem] text-white/75">{SUPERVISING_AUTHORITY_AR}</p>
              <p className="text-xs text-white/85">{portalTitle}</p>
            </div>
          </Link>
          <LogoutForm
            callbackUrl={logoutCallbackUrl}
            className="text-white/90 hover:bg-white/10 hover:text-white"
          />
        </div>
        <div className="gov-divider-flag gov-divider-flag--full mx-auto max-w-6xl opacity-80" aria-hidden />
      </header>
      <div className="mx-auto grid max-w-6xl gap-6 px-4 py-8 lg:grid-cols-[14rem_1fr] lg:items-start">
        <aside className="gov-card p-0 lg:sticky lg:top-4">
          <p className="gov-aside-title">القائمة</p>
          <div className="px-1 pb-2">{nav}</div>
        </aside>
        <div className="min-w-0">{children}</div>
      </div>
    </NavigationWaitGate>
  );
}
