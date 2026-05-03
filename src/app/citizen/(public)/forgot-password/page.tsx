"use client";

import { useActionState, useId } from "react";
import Link from "next/link";
import { StateEmblem } from "@/components/gov/StateEmblem";
import { ENTITY_NAME_AR, PORTAL_SUBTITLE } from "@/lib/entity";
import { requestPasswordResetAction } from "@/actions/citizen-auth";
import { AsyncWaitOverlay } from "@/components/ui/AsyncWaitOverlay";

export default function ForgotPasswordPage() {
  const [st, act, isPending] = useActionState(requestPasswordResetAction, undefined);
  const id = useId();

  return (
    <div className="gov-page flex min-h-dvh flex-col">
      <AsyncWaitOverlay active={isPending} variant="gov" />
      <header className="gov-header">
        <div className="mx-auto flex max-w-3xl flex-wrap items-center justify-center gap-4 px-4 py-5 sm:justify-between">
          <div className="flex items-center gap-3">
            <StateEmblem height={58} />
            <div className="text-start text-white">
              <p className="text-xs text-white/80">{PORTAL_SUBTITLE}</p>
              <p className="text-lg font-bold">{ENTITY_NAME_AR}</p>
              <p className="text-sm text-white/90">نسيت كلمة المرور</p>
            </div>
          </div>
        </div>
      </header>
      <main className="flex flex-1 justify-center px-4 py-10">
        <div className="gov-card w-full max-w-md p-6">
          <h1 className="mb-1 text-lg font-bold">استعادة كلمة المرور</h1>
          <p className="mb-6 text-sm text-[var(--gov-muted)]">
            أدخل البريد الإلكتروني أو رقم الهاتف المسجّلين في حسابك.
          </p>
          <form action={act} className="space-y-4">
            {st && "error" in st && (
              <p className="border border-[var(--gov-flag-red)]/40 bg-[var(--gov-flag-red)]/5 px-3 py-2 text-sm">
                {st.error}
              </p>
            )}
            {st && "ok" in st && st.ok && st.message && (
              <p className="border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-900">{st.message}</p>
            )}
            <div>
              <label htmlFor={id} className="mb-1.5 block text-sm font-medium">
                البريد الإلكتروني أو رقم الهاتف
              </label>
              <input
                id={id}
                name="identifier"
                type="text"
                required
                autoComplete="username"
                className="gov-input w-full px-3 py-2.5 text-sm outline-none focus:ring-1 focus:ring-[var(--gov-primary)]"
              />
            </div>
            <button
              type="submit"
              disabled={isPending}
              className="gov-btn-primary w-full px-4 py-3 text-sm font-semibold disabled:opacity-60"
            >
              {isPending ? "يرجى الانتظار…" : "إرسال رمز التحقق"}
            </button>
          </form>
          {st && "ok" in st && st.ok && (
            <p className="mt-4 text-center text-sm">
              <Link
                className="font-semibold text-[var(--gov-primary)] underline-offset-2 hover:underline"
                href="/citizen/forgot-password/verify"
              >
                المتابعة إلى إدخال الرمز
              </Link>
            </p>
          )}
          <p className="mt-6 text-center text-sm text-[var(--gov-muted)]">
            <Link className="font-semibold text-[var(--gov-primary)] hover:underline" href="/citizen/login">
              العودة لتسجيل الدخول
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}
