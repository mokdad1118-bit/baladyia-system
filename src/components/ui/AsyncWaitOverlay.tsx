"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/cn";

const SLOW_HINT_MS = 2800;

export type AsyncWaitVariant = "emerald" | "gov";

function AsyncWaitBody({ variant }: { variant: AsyncWaitVariant }) {
  const [slowHint, setSlowHint] = useState(false);

  useEffect(() => {
    const id = window.setTimeout(() => setSlowHint(true), SLOW_HINT_MS);
    return () => window.clearTimeout(id);
  }, []);

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/45 px-4 backdrop-blur-sm"
      role="status"
      aria-live="polite"
      aria-busy="true"
      aria-label="يرجى الانتظار"
    >
      <div
        className={cn(
          "w-full max-w-sm rounded-2xl border px-6 py-8 text-center shadow-2xl",
          variant === "emerald"
            ? "border-emerald-200/90 bg-white/97 text-slate-900"
            : "border-[var(--gov-border)] bg-white text-[var(--gov-text)]",
        )}
      >
        <div className="mx-auto mb-5 flex justify-center">
          <span
            className={cn(
              "inline-block h-11 w-11 animate-spin rounded-full border-2 border-current border-t-transparent",
              variant === "emerald" ? "text-emerald-700" : "text-[var(--gov-primary)]",
            )}
            aria-hidden
          />
        </div>
        <p className="text-base font-bold tracking-tight">يرجى الانتظار</p>
        <p
          className={cn(
            "mt-2 text-sm leading-relaxed",
            variant === "emerald" ? "text-slate-600" : "text-[var(--gov-muted)]",
          )}
        >
          {slowHint ? (
            <>
              يبدو أن الاتصال بالإنترنت{" "}
              <span
                className={cn(
                  "font-semibold",
                  variant === "emerald" ? "text-emerald-900" : "text-[var(--gov-text)]",
                )}
              >
                بطيء
              </span>
              . جاري إكمال العملية…{" "}
              <span className={cn("font-medium", variant === "emerald" ? "text-slate-800" : "text-[var(--gov-text)]")}>
                لا تغلق هذه الصفحة.
              </span>
            </>
          ) : (
            <>جاري المعالجة على الخادم، قد يستغرق ذلك بضع ثوانٍ…</>
          )}
        </p>
      </div>
    </div>
  );
}

/**
 * طبقة انتظار عند عمليات الشبكة (دخول، تسجيل، إرسال طلب…).
 * بعد بضع ثوانٍ تظهر رسالة مناسبة لضعف الاتصال دون إلغاء العملية.
 */
export function AsyncWaitOverlay({
  active,
  variant = "gov",
}: {
  active: boolean;
  variant?: AsyncWaitVariant;
}) {
  if (!active) return null;
  return <AsyncWaitBody variant={variant} />;
}
