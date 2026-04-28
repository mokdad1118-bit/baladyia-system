"use client";

import { useActionState, useId } from "react";
import { registerCitizen } from "@/actions/auth";
import Link from "next/link";
import { CitizenAuthShell } from "@/components/citizen/CitizenAuthShell";
import { PasswordRevealField } from "@/components/PasswordRevealField";

export default function CitizenRegisterPage() {
  const [st, act] = useActionState(registerCitizen, undefined);
  const passwordFieldId = useId();
  return (
    <CitizenAuthShell headerAside={<p className="text-sm font-semibold text-emerald-900">إنشاء حساب جديد</p>}>
      <main className="flex flex-1 justify-center px-4 py-10">
        <div className="w-full max-w-md rounded-2xl border border-emerald-100/90 bg-white/90 p-6 shadow-sm">
          <h1 className="mb-1 text-lg font-bold text-slate-900">إنشاء حساب مواطن</h1>
          <p className="mb-6 text-sm text-slate-600">للمتابعة والتقديم على الخدمات إلكترونياً.</p>
          <form action={act} className="space-y-4">
            {st?.error && (
              <p className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-900">{st.error}</p>
            )}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-800">الاسم الثلاثي</label>
              <input
                name="name"
                required
                minLength={2}
                autoComplete="name"
                className="gov-input w-full px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-emerald-600/35"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-800">رقم الهاتف (واتساب)</label>
              <input
                name="phone"
                type="tel"
                required
                inputMode="numeric"
                autoComplete="tel"
                dir="ltr"
                className="gov-input w-full px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-emerald-600/35"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-800">بريد إشعارات (اختياري)</label>
              <input
                name="notificationEmail"
                type="email"
                autoComplete="email"
                className="gov-input w-full px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-emerald-600/35"
              />
            </div>
            <div>
              <label htmlFor={passwordFieldId} className="mb-1.5 block text-sm font-medium text-slate-800">
                كلمة المرور (6 أحرف على الأقل)
              </label>
              <PasswordRevealField
                inputId={passwordFieldId}
                name="password"
                minLength={6}
                autoComplete="new-password"
                variant="emerald"
              />
            </div>
            <button
              type="submit"
              className="w-full rounded-xl bg-emerald-700 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-800"
            >
              إنشاء الحساب
            </button>
          </form>
          <p className="mt-6 text-center text-sm text-slate-600">
            لديك حساب؟{" "}
            <Link className="font-semibold text-emerald-800 underline-offset-2 hover:underline" href="/login">
              تسجيل الدخول
            </Link>
          </p>
        </div>
      </main>
    </CitizenAuthShell>
  );
}
