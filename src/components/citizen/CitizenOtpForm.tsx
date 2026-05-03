"use client";

import { useActionState, useEffect, useId } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { SimpleMessageState } from "@/actions/citizen-auth";
import { AsyncWaitOverlay } from "@/components/ui/AsyncWaitOverlay";
import { cn } from "@/lib/cn";

type VerifyFn = (prev: SimpleMessageState, fd: FormData) => Promise<SimpleMessageState>;
type ResendFn = (prev: SimpleMessageState, fd: FormData) => Promise<SimpleMessageState>;

export function CitizenOtpForm({
  title,
  description,
  verifyAction,
  resendAction,
  successRedirectHref,
  loginHref,
  variant,
}: {
  title: string;
  description: string;
  verifyAction: VerifyFn;
  resendAction: ResendFn;
  successRedirectHref: string;
  loginHref: string;
  variant: "emerald" | "gov";
}) {
  const [st, verifyAct, verifyPending] = useActionState(verifyAction, undefined);
  const [resSt, resendAct, resendPending] = useActionState(resendAction, undefined);
  const codeId = useId();
  const router = useRouter();
  const isEmerald = variant === "emerald";

  useEffect(() => {
    if (!st || !("ok" in st) || !st.ok) return;
    router.replace(successRedirectHref);
  }, [st, successRedirectHref, router]);

  const errBox = isEmerald
    ? "rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-900"
    : "border border-[var(--gov-flag-red)]/40 bg-[var(--gov-flag-red)]/5 px-3 py-2 text-sm";
  const okBox = isEmerald
    ? "rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-900"
    : "border border-emerald-200/80 bg-emerald-50/90 px-3 py-2 text-sm";
  const btn = isEmerald
    ? "w-full rounded-xl bg-emerald-700 px-4 py-3 text-sm font-semibold text-white shadow-sm hover:bg-emerald-800 disabled:opacity-60"
    : "gov-btn-primary w-full px-4 py-3 text-sm font-semibold disabled:opacity-60";
  const secondary = isEmerald
    ? "w-full rounded-xl border border-emerald-200 bg-white px-4 py-2.5 text-sm font-medium text-emerald-900 hover:bg-emerald-50 disabled:opacity-60"
    : "w-full border border-[var(--gov-border)] bg-white px-4 py-2.5 text-sm font-medium disabled:opacity-60";

  return (
    <>
      <AsyncWaitOverlay active={verifyPending || resendPending} variant={isEmerald ? "emerald" : "gov"} />
      <div
        className={cn(
          "w-full max-w-md p-6",
          isEmerald ? "rounded-2xl border border-emerald-100/90 bg-white/90 shadow-sm" : "gov-card",
        )}
      >
        <h1 className={cn("mb-1 text-lg font-bold", isEmerald ? "text-slate-900" : "")}>{title}</h1>
        <p className={cn("mb-6 text-sm", isEmerald ? "text-slate-600" : "text-[var(--gov-muted)]")}>{description}</p>

        {st && "error" in st && <p className={cn("mb-4", errBox)}>{st.error}</p>}
        {resSt && "error" in resSt && <p className={cn("mb-4", errBox)}>{resSt.error}</p>}
        {resSt && "ok" in resSt && resSt.ok && resSt.message && <p className={cn("mb-4", okBox)}>{resSt.message}</p>}

        <form action={verifyAct} className="space-y-4">
          <div>
            <label htmlFor={codeId} className={cn("mb-1.5 block text-sm font-medium", isEmerald && "text-slate-800")}>
              رمز التحقق (٦ أرقام)
            </label>
            <input
              id={codeId}
              name="code"
              required
              inputMode="numeric"
              autoComplete="one-time-code"
              pattern="[0-9]{6}"
              maxLength={6}
              minLength={6}
              dir="ltr"
              placeholder="••••••"
              className={cn(
                "gov-input w-full px-3 py-2.5 text-center text-lg tracking-[0.4em] outline-none",
                isEmerald ? "focus:ring-2 focus:ring-emerald-600/35" : "focus:ring-1 focus:ring-[var(--gov-primary)]",
              )}
            />
          </div>
          <button type="submit" disabled={verifyPending} className={btn}>
            {verifyPending ? "جاري التحقق…" : "تأكيد"}
          </button>
        </form>

        <form action={resendAct} className="mt-3">
          <button type="submit" disabled={resendPending} className={secondary}>
            {resendPending ? "جاري الإرسال…" : "إعادة إرسال الرمز (بعد ٦٠ ثانية)"}
          </button>
        </form>

        <p className={cn("mt-6 text-center text-sm", isEmerald ? "text-slate-600" : "text-[var(--gov-muted)]")}>
          <Link
            href={loginHref}
            className={cn("font-semibold underline-offset-2 hover:underline", isEmerald ? "text-emerald-800" : "")}
          >
            العودة لتسجيل الدخول
          </Link>
        </p>
      </div>
    </>
  );
}
