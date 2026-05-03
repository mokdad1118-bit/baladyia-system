"use client";

import { useActionState, useEffect, useId, useState } from "react";
import { useRouter } from "next/navigation";
import { registerCitizen } from "@/actions/auth";
import Link from "next/link";
import { StateEmblem } from "@/components/gov/StateEmblem";
import { ENTITY_NAME_AR, PORTAL_SUBTITLE } from "@/lib/entity";
import { PasswordRevealField } from "@/components/PasswordRevealField";
import { AsyncWaitOverlay } from "@/components/ui/AsyncWaitOverlay";
import { CITIZEN_POST_REGISTER_PASSWORD_KEY } from "@/lib/citizen-login-prefill";

export default function CitizenRegisterPage() {
  const [st, act, isPending] = useActionState(registerCitizen, undefined);
  const passwordFieldId = useId();
  const [password, setPassword] = useState("");
  const router = useRouter();

  useEffect(() => {
    if (!st || !("ok" in st) || !st.ok) return;
    try {
      sessionStorage.setItem(CITIZEN_POST_REGISTER_PASSWORD_KEY, password);
    } catch {
      /* وضع خاص */
    }
    router.replace(`/citizen/login?registered=1&identifier=${encodeURIComponent(st.identifier)}`);
  }, [st, password, router]);

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
              <p className="text-sm text-white/90">إنشاء حساب جديد</p>
            </div>
          </div>
        </div>
      </header>
      <main className="flex flex-1 justify-center px-4 py-10">
        <div className="gov-card w-full max-w-md p-6">
          <h1 className="mb-1 text-lg font-bold">إنشاء حساب مواطن</h1>
          <p className="mb-6 text-sm text-[var(--gov-muted)]">للمتابعة والتقديم على الخدمات إلكترونياً.</p>
          <form action={act} className="space-y-4">
            {st && "error" in st && (
              <p className="border border-[var(--gov-flag-red)]/40 bg-[var(--gov-flag-red)]/5 px-3 py-2 text-sm">
                {st.error}
              </p>
            )}
            <div>
              <label className="mb-1.5 block text-sm font-medium">الاسم الثلاثي</label>
              <input
                name="name"
                required
                minLength={2}
                autoComplete="name"
                className="gov-input w-full px-3 py-2.5 text-sm outline-none focus:ring-1 focus:ring-[var(--gov-primary)]"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium">رقم الهاتف (واتساب)</label>
              <input
                name="phone"
                type="tel"
                required
                inputMode="numeric"
                autoComplete="tel"
                dir="ltr"
                className="gov-input w-full px-3 py-2.5 text-sm outline-none focus:ring-1 focus:ring-[var(--gov-primary)]"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium">بريد إشعارات (اختياري)</label>
              <input
                name="notificationEmail"
                type="email"
                autoComplete="email"
                className="gov-input w-full px-3 py-2.5 text-sm outline-none focus:ring-1 focus:ring-[var(--gov-primary)]"
              />
            </div>
            <div>
              <label htmlFor={passwordFieldId} className="mb-1.5 block text-sm font-medium">
                كلمة المرور (6 أحرف على الأقل)
              </label>
              <PasswordRevealField
                inputId={passwordFieldId}
                name="password"
                minLength={6}
                autoComplete="new-password"
                variant="gov"
                value={password}
                onValueChange={setPassword}
              />
            </div>
            <button
              type="submit"
              disabled={isPending}
              className="gov-btn-primary w-full px-4 py-3 text-sm font-semibold disabled:opacity-60"
            >
              {isPending ? "يرجى الانتظار…" : "إنشاء الحساب"}
            </button>
          </form>
          <p className="mt-6 text-center text-sm text-[var(--gov-muted)]">
            لديك حساب؟{" "}
            <Link className="font-semibold text-[var(--gov-primary)] hover:underline" href="/citizen/login">
              تسجيل الدخول
            </Link>
          </p>
          <p className="mt-6 text-center text-xs">
            <Link href="/" className="text-[var(--gov-muted)] hover:underline">
              العودة لاختيار البوابة
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}
