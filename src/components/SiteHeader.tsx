import Link from "next/link";
import { CITIZEN_PORTAL_NAME_AR, OFFICIAL_SCOPE_AR } from "@/lib/entity";
import { MainNav } from "./MainNav";
import { IconBuilding } from "./icons";

export function SiteHeader() {
  return (
    <header
      className="site-header sticky top-0 z-40 border-b border-slate-200/60 bg-white/80 backdrop-blur-md supports-[backdrop-filter]:bg-white/70"
    >
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-4 sm:px-5">
        <Link
          href="/"
          className="group flex min-w-0 items-center gap-2.5 text-slate-900 no-underline"
        >
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-600 to-emerald-900 text-white shadow-sm ring-1 ring-black/5">
            <IconBuilding className="h-5 w-5" />
          </span>
          <span className="min-w-0">
            <span className="block truncate text-sm font-bold tracking-tight sm:text-base">
              {CITIZEN_PORTAL_NAME_AR}
            </span>
            <span className="block text-[0.7rem] font-medium text-slate-500 sm:text-xs">
              {OFFICIAL_SCOPE_AR}
            </span>
          </span>
        </Link>
        <MainNav />
      </div>
    </header>
  );
}
