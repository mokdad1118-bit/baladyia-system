"use client";

import { useActionState, useEffect, useId, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { registerCitizen } from "@/actions/citizen-auth";
import { PasswordRevealField } from "@/components/PasswordRevealField";
import { AsyncWaitOverlay } from "@/components/ui/AsyncWaitOverlay";
import { cn } from "@/lib/cn";

type Variant = "emerald" | "gov";

export function CitizenRegisterForm({
  verifyHref,
  loginHref,
  variant,
  extraFooter,
}: {
  verifyHref: string;
  loginHref: string;
  variant: Variant;
  extraFooter?: React.ReactNode;
}) {
  const [st, act, isPending] = useActionState(registerCitizen, undefined);
  const passwordFieldId = useId();
  const confirmFieldId = useId();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const router = useRouter();

  useEffect(() => {
    if (!st || !("ok" in st) || !st.ok) return;
    /** لا تعيد التوجيه فوراً إن كان إرسال البريد فاشلاً — ليبقى التحذير ظاهراً */
    if ("warning" in st && st.warning) return;
    router.replace(verifyHref);
  }, [st, verifyHref, router]);

  const isEmerald = variant === "emerald";
  const card = isEmerald
    ? "w-full max-w-md rounded-2xl border border-emerald-100/90 bg-white/90 p-6 shadow-sm"
    : "gov-card w-full max-w-md p-6";
  const label = isEmerald ? "text-slate-800" : "";
  const inputRing = isEmerald ? "focus:ring-2 focus:ring-emerald-600/35" : "focus:ring-1 focus:ring-[var(--gov-primary)]";
  const errBox = isEmerald
    ? "rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-900"
    : "border border-[var(--gov-flag-red)]/40 bg-[var(--gov-flag-red)]/5 px-3 py-2 text-sm";
  const warnBox = isEmerald
    ? "rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-950"
    : "border border-amber-300/60 bg-amber-50 px-3 py-2 text-sm";
  const btn = isEmerald
    ? "w-full rounded-xl bg-emerald-700 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-800 disabled:opacity-60"
    : "gov-btn-primary w-full px-4 py-3 text-sm font-semibold disabled:opacity-60";

  return (
    <>
      <AsyncWaitOverlay active={isPending} variant={isEmerald ? "emerald" : "gov"} />
      <div className={card}>
        <h1 className={cn("mb-1 text-lg font-bold", isEmerald ? "text-slate-900" : "")}>إنشاء حساب مواطن</h1>
        <p className={cn("mb-6 text-sm", isEmerald ? "text-slate-600" : "text-[var(--gov-muted)]")}>
          بعد التسجيل يُرسل رمز تفعيل مكوّن من ٦ أرقام إلى بريدك الإلكتروني.
        </p>
        <form
          action={act}
          className="space-y-4"
          onSubmit={(e) => {
            if (password !== confirm) {
              e.preventDefault();
              return;
            }
          }}
        >
          {st && "error" in st && <p className={errBox}>{st.error}</p>}
          <div>
            <label className={cn("mb-1.5 block text-sm font-medium", label)}>الاسم الثلاثي</label>
            <input
              name="fullName"
              required
              minLength={3}
              autoComplete="name"
              className={cn("gov-input w-full px-3 py-2.5 text-sm outline-none", inputRing)}
            />
          </div>
          <div>
            <label className={cn("mb-1.5 block text-sm font-medium", label)}>البريد الإلكتروني</label>
            <input
              name="email"
              type="email"
              required
              autoComplete="email"
              dir="ltr"
              className={cn("gov-input w-full px-3 py-2.5 text-sm outline-none", inputRing)}
            />
          </div>
          <div>
            <label className={cn("mb-1.5 block text-sm font-medium", label)}>رقم الهاتف (واتساب)</label>
            <input
              name="phone"
              type="tel"
              required
              inputMode="numeric"
              autoComplete="tel"
              dir="ltr"
              placeholder="9639xxxxxxxx"
              className={cn("gov-input w-full px-3 py-2.5 text-sm outline-none", inputRing)}
            />
          </div>
          <div>
            <label className={cn("mb-1.5 block text-sm font-medium", label)}>الرقم الوطني</label>
            <input
              name="nationalId"
              required
              inputMode="numeric"
              autoComplete="off"
              dir="ltr"
              minLength={10}
              maxLength={11}
              pattern="[0-9]{10,11}"
              title="١٠ أو ١١ رقماً"
              className={cn("gov-input w-full px-3 py-2.5 text-sm outline-none", inputRing)}
            />
          </div>
          <div>
            <label htmlFor={passwordFieldId} className={cn("mb-1.5 block text-sm font-medium", label)}>
              كلمة المرور (٨ أحرف، حرف إنجليزي ورقم)
            </label>
            <PasswordRevealField
              inputId={passwordFieldId}
              name="password"
              minLength={8}
              autoComplete="new-password"
              variant={isEmerald ? "emerald" : "gov"}
              value={password}
              onValueChange={setPassword}
            />
          </div>
          <div>
            <label htmlFor={confirmFieldId} className={cn("mb-1.5 block text-sm font-medium", label)}>
              تأكيد كلمة المرور
            </label>
            <PasswordRevealField
              inputId={confirmFieldId}
              name="confirm"
              minLength={8}
              autoComplete="new-password"
              variant={isEmerald ? "emerald" : "gov"}
              value={confirm}
              onValueChange={setConfirm}
            />
          </div>
          {password && confirm && password !== confirm && (
            <p className={errBox}>تأكيد كلمة المرور غير متطابق</p>
          )}
          <button type="submit" disabled={isPending || password !== confirm} className={btn}>
            {isPending ? "يرجى الانتظار…" : "إنشاء الحساب وإرسال رمز التفعيل"}
          </button>
        </form>
        {st && "ok" in st && st.ok && st.warning && (
          <div className={cn("mt-4 space-y-3 rounded-xl border px-4 py-3 text-sm", warnBox)}>
            <p className="font-semibold">تم إنشاء الحساب، لكن تعذّر إرسال البريد أو تأخر:</p>
            <p className="leading-relaxed">{st.warning}</p>
            <p className="text-xs opacity-90">
              بعد ضبط الإرسال (مثلاً Resend على السيرفر)، استخدم الرابط أدناه ثم «إعادة إرسال الرمز».
            </p>
            <Link
              href={verifyHref}
              className={cn(
                "inline-block font-semibold underline-offset-2 hover:underline",
                isEmerald ? "text-emerald-900" : "text-[var(--gov-primary)]",
              )}
            >
              المتابعة إلى صفحة إدخال الرمز →
            </Link>
          </div>
        )}
        <p className={cn("mt-6 text-center text-sm", isEmerald ? "text-slate-600" : "text-[var(--gov-muted)]")}>
          لديك حساب؟{" "}
          <Link
            className={cn(
              "font-semibold underline-offset-2 hover:underline",
              isEmerald ? "text-emerald-800" : "text-[var(--gov-primary)]",
            )}
            href={loginHref}
          >
            تسجيل الدخول
          </Link>
        </p>
        {extraFooter}
      </div>
    </>
  );
}
