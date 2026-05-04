"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { cn } from "@/lib/cn";

function currentLocationKey(pathname: string, search: string) {
  return pathname + (search ? `?${search}` : "");
}

function NavigationWaitGateInner({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const pathname = usePathname() ?? "";
  const searchParams = useSearchParams();
  const search = searchParams?.toString() ?? "";
  const [pending, setPending] = useState(false);

  useEffect(() => {
    setPending(false);
  }, [pathname, search]);

  useEffect(() => {
    if (!pending) return;
    const t = window.setTimeout(() => setPending(false), 12_000);
    return () => window.clearTimeout(t);
  }, [pending]);

  const onClickCapture = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const el = (e.target as HTMLElement | null)?.closest?.("a[href]");
      if (!el) return;
      const a = el as HTMLAnchorElement;
      const href = a.getAttribute("href");
      if (!href?.trim() || href.startsWith("#")) return;
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      if (e.button !== 0) return;
      const target = a.getAttribute("target");
      if (target && target !== "_self") return;
      if (a.hasAttribute("download")) return;

      let url: URL;
      try {
        url = new URL(href, window.location.origin);
      } catch {
        return;
      }
      if (url.origin !== window.location.origin) return;

      const next = currentLocationKey(url.pathname, url.search.replace(/^\?/, ""));
      const current = currentLocationKey(pathname, search);
      if (next === current) return;

      setPending(true);
    },
    [pathname, search],
  );

  return (
    <div className={cn("relative", className)} onClickCapture={onClickCapture}>
      {pending ? (
        <div
          className="pointer-events-none fixed inset-x-0 bottom-0 z-[200] flex justify-center px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]"
          role="status"
          aria-live="polite"
          aria-busy="true"
        >
          <div className="flex max-w-lg items-center gap-3 rounded-t-xl border border-[var(--gov-border,#cbd5e1)] bg-white/95 px-4 py-3 shadow-lg backdrop-blur-sm supports-[backdrop-filter]:bg-white/90 rtl:flex-row-reverse">
            <span
              className="inline-block size-5 shrink-0 animate-spin rounded-full border-2 border-[var(--gov-primary,#047857)] border-t-transparent"
              aria-hidden
            />
            <p className="text-center text-sm leading-snug text-[var(--gov-text,#0f172a)]">
              <span className="font-semibold">يرجى الانتظار</span>
              {" — "}
              جاري تحميل الصفحة. إذا كان الاتصال ضعيفاً قد يستغرق الأمر وقتاً أطول قليلاً.
            </p>
          </div>
        </div>
      ) : null}
      {children}
    </div>
  );
}

/**
 * يعرض إشعار انتظار عند النقر على روابط التنقّل الداخلية (مثل قائمة لوحة التحكم)
 * حتى تكتمل جلب الصفحة — مفيد عند بطء الشبكة.
 */
export function NavigationWaitGate({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Suspense fallback={<div className={cn("relative", className)}>{children}</div>}>
      <NavigationWaitGateInner className={className}>{children}</NavigationWaitGateInner>
    </Suspense>
  );
}
