"use client";

import { usePathname } from "next/navigation";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { cn } from "@/lib/cn";

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
          <span
            className="inline-block h-10 w-10 animate-spin rounded-full border-2 border-[var(--gov-primary)] border-t-transparent"
            aria-hidden
          />
        </div>
        <p className="text-base font-bold text-[var(--gov-text)]">يرجى الانتظار</p>
        <p className="mt-1.5 text-sm text-[var(--gov-muted)]">جاري التحميل…</p>
      </div>
    </div>
  );
}
