import type { ReactNode } from "react";
import Link from "next/link";
import { StateEmblem } from "@/components/gov/StateEmblem";
import { ENTITY_NAME_AR, PORTAL_SUBTITLE } from "@/lib/entity";

/**
 * هيكل بصري مخصّص لبوابة المواطن فقط (تسجيل / دخول).
 * منفصل عن هوية لوحة التحكم حتى لا يُخلط بين الواجهتين.
 */
export function CitizenAuthShell({
  children,
  headerAside,
}: {
  children: ReactNode;
  /** عنوان فرعي بجانب الشعار (مثلاً «تسجيل دخول المواطنين») */
  headerAside?: ReactNode;
}) {
  return (
    <div className="flex min-h-dvh flex-col bg-gradient-to-b from-emerald-50/80 via-white to-emerald-100/50">
      <header className="border-b border-emerald-100/90 bg-white/95 shadow-sm backdrop-blur-sm">
        <div className="gov-divider-flag mx-auto mb-2 max-w-3xl opacity-60" />
        <div className="mx-auto flex max-w-3xl flex-wrap items-center justify-between gap-4 px-4 py-4 sm:py-5">
          <Link href="/services" className="flex items-center gap-3 no-underline">
            <StateEmblem height={48} />
            <div className="text-start text-slate-900">
              <p className="text-[0.65rem] font-medium uppercase tracking-wide text-emerald-800/90">{PORTAL_SUBTITLE}</p>
              <p className="text-base font-bold leading-snug sm:text-lg">{ENTITY_NAME_AR}</p>
              <p className="text-xs text-slate-500">خدمات المواطنين الإلكترونية</p>
            </div>
          </Link>
          {headerAside ? <div className="w-full text-center sm:w-auto sm:text-start">{headerAside}</div> : null}
        </div>
      </header>
      {children}
    </div>
  );
}
