"use client";

import { useActionState, useEffect, useId, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { resetCitizenPasswordAction } from "@/actions/citizen-auth";
import { PasswordRevealField } from "@/components/PasswordRevealField";
import { AsyncWaitOverlay } from "@/components/ui/AsyncWaitOverlay";
import { cn } from "@/lib/cn";

export function CitizenNewPasswordForm({
  loginHref,
  variant,
}: {
  loginHref: string;
  variant: "emerald" | "gov";
}) {
  const [st, act, isPending] = useActionState(resetCitizenPasswordAction, undefined);
  const pwId = useId();
  const cfId = useId();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const router = useRouter();
  const isEmerald = variant === "emerald";

  useEffect(() => {
    if (!st || !("ok" in st) || !st.ok) return;
    router.replace(`${loginHref}?reset=1`);
  }, [st, loginHref, router]);

  const errBox = isEmerald
    ? "rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-900"
    : "border border-[var(--gov-flag-red)]/40 bg-[var(--gov-flag-red)]/5 px-3 py-2 text-sm";
  const btn = isEmerald
    ? "w-full rounded-xl bg-emerald-700 px-4 py-3 text-sm font-semibold text-white shadow-sm hover:bg-emerald-800 disabled:opacity-60"
    : "gov-btn-primary w-full px-4 py-3 text-sm font-semibold disabled:opacity-60";

  return (
    <>
      <AsyncWaitOverlay active={isPending} variant={isEmerald ? "emerald" : "gov"} />
      <div
        className={cn(
          "w-full max-w-md p-6",
          isEmerald ? "rounded-2xl border border-emerald-100/90 bg-white/90 shadow-sm" : "gov-card",
        )}
      >
        <h1 className={cn("mb-1 text-lg font-bold", isEmerald ? "text-slate-900" : "")}>كلمة مرور جديدة</h1>
        <p className={cn("mb-6 text-sm", isEmerald ? "text-slate-600" : "text-[var(--gov-muted)]")}>
          اختر كلمة مرور قوية (٨ أحرف على الأقل، حرف إنجليزي ورقم).
        </p>
        <form
          action={act}
          className="space-y-4"
          onSubmit={(e) => {
            if (password !== confirm) e.preventDefault();
          }}
        >
          {st && "error" in st && <p className={errBox}>{st.error}</p>}
          <div>
            <label htmlFor={pwId} className={cn("mb-1.5 block text-sm font-medium", isEmerald && "text-slate-800")}>
              كلمة المرور الجديدة
            </label>
            <PasswordRevealField
              inputId={pwId}
              name="password"
              minLength={8}
              autoComplete="new-password"
              variant={isEmerald ? "emerald" : "gov"}
              value={password}
              onValueChange={setPassword}
            />
          </div>
          <div>
            <label htmlFor={cfId} className={cn("mb-1.5 block text-sm font-medium", isEmerald && "text-slate-800")}>
              تأكيد كلمة المرور
            </label>
            <PasswordRevealField
              inputId={cfId}
              name="confirm"
              minLength={8}
              autoComplete="new-password"
              variant={isEmerald ? "emerald" : "gov"}
              value={confirm}
              onValueChange={setConfirm}
            />
          </div>
          {password && confirm && password !== confirm && <p className={errBox}>تأكيد كلمة المرور غير متطابق</p>}
          <button type="submit" disabled={isPending || password !== confirm} className={btn}>
            {isPending ? "جاري الحفظ…" : "حفظ كلمة المرور"}
          </button>
        </form>
        <p className={cn("mt-6 text-center text-sm", isEmerald ? "text-slate-600" : "text-[var(--gov-muted)]")}>
          <Link
            href={loginHref}
            className={cn("font-semibold underline-offset-2 hover:underline", isEmerald ? "text-emerald-800" : "")}
          >
            تسجيل الدخول
          </Link>
        </p>
      </div>
    </>
  );
}
