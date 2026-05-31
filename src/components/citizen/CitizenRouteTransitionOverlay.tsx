"use client";

import { usePathname } from "next/navigation";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { cn } from "@/lib/cn";
import { BRAND_ASSETS } from "@/lib/entity";

/**
 * يظهر عند النقر على روابط التنقّل الداخلي حتى يتغيّر المسار (RSC جاهز).
 * لا يغطي نماذج تستخدم router أو روابط target=_blank.
 */
export function CitizenRouteTransitionOverlay() {
  const pathname = usePathname() ?? "";
  const [busy, setBusy] = useState(false);
  const prevPathRef = useRef(pathname);

  useLayoutEffect(() => {
    if (prevPathRef.current !== pathname) {
      prevPathRef.current = pathname;
      setBusy(false);
    }
  }, [pathname]);

  const onDocClickCapture = useCallback((e: MouseEvent) => {
    if (e.defaultPrevented || e.button !== 0) return;
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    const el = (e.target as Node | null)?.nodeType === Node.ELEMENT_NODE ? (e.target as Element) : null;
    const a = el?.closest?.("a[href]");
    if (!a || !(a instanceof HTMLAnchorElement)) return;
    if (a.target === "_blank" || a.hasAttribute("download")) return;
    const href = a.getAttribute("href");
    if (!href || href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("tel:")) return;
    let url: URL;
    try {
      url = new URL(a.href, window.location.origin);
    } catch {
      return;
    }
    if (url.origin !== window.location.origin) return;
    if (url.pathname === window.location.pathname && url.search === window.location.search) return;
    setBusy(true);
  }, []);

  useEffect(() => {
    document.addEventListener("click", onDocClickCapture, true);
    return () => document.removeEventListener("click", onDocClickCapture, true);
  }, [onDocClickCapture]);

  if (!busy) return null;

  return (
    <div
      className="pointer-events-none fixed inset-0 z-[90] flex items-center justify-center bg-[var(--gov-text)]/20 px-4 backdrop-blur-[2px]"
      role="status"
      aria-live="polite"
      aria-busy="true"
      aria-label="جاري التحميل"
    >
      <div
        className={cn(
          "pointer-events-none max-w-sm rounded-2xl border border-[var(--gov-border)] bg-white px-8 py-7 text-center shadow-xl",
        )}
      >
        <div className="mx-auto mb-4 flex justify-center">
          <span className="flex h-16 w-16 animate-pulse items-center justify-center rounded-full border border-[var(--gov-border)] bg-white shadow-sm">
            {/* eslint-disable-next-line @next/next/no-img-element -- شعار ثابت من public للتحميل السريع داخل طبقة الانتظار */}
            <img src={BRAND_ASSETS.stateEmblemPng} alt="" className="h-12 w-12 rounded-full object-contain" aria-hidden />
          </span>
        </div>
        <p className="text-base font-bold text-[var(--gov-text)]">يرجى الانتظار</p>
        <p className="mt-1.5 text-sm text-[var(--gov-muted)]">جاري التحميل…</p>
      </div>
    </div>
  );
}
