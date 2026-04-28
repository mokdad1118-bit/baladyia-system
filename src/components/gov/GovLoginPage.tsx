"use client";

import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useId, useState } from "react";
import type { AuthPortal } from "@/lib/auth-portal";
import { safePostLoginRedirectPath } from "@/lib/portal-paths";
import { StateEmblem } from "@/components/gov/StateEmblem";
import { ENTITY_NAME_AR, PORTAL_SUBTITLE } from "@/lib/entity";
import { CitizenAuthShell } from "@/components/citizen/CitizenAuthShell";
import Link from "next/link";
import { cn } from "@/lib/cn";
import { PasswordRevealField } from "@/components/PasswordRevealField";

/**
 * صفحتا دخول منفصلتان بالواجهة والمسار والبوابة (portal في NextAuth).
 * لا يوجد اختيار نوع مستخدم — المواطن يدخل من /login والموظف من /admin/login فقط.
 */
export function GovLoginPage({
  portal,
  title,
  subtitle,
  identifierLabel,
  identifierPlaceholder,
  identifierAutocomplete,
  extraFooter,
  staffPortalWeb,
}: {
  portal: AuthPortal;
  /** يُعرض بجانب الشعار على دخول المواطن؛ اتركه فارغًا لإخفاء السطر */
  title?: string;
  subtitle: string;
  identifierLabel: string;
  identifierPlaceholder: string;
  identifierAutocomplete?: string;
  extraFooter?: React.ReactNode;
  staffPortalWeb?: boolean;
}) {
  const router = useRouter();
  const sp = useSearchParams();
  const [err, setErr] = useState<string | null>(null);
  const [pend, setPend] = useState(false);
  const passwordFieldId = useId();
  const isCitizen = portal === "citizen";

  const form = (
    <div
      className={cn(
        "w-full max-w-md rounded-2xl border p-6 shadow-sm",
        isCitizen ? "border-emerald-100/90 bg-white/90" : "gov-card border-[var(--gov-border)]",
      )}
    >
      <h1 className="mb-1 text-lg font-bold text-[var(--gov-text)]">{subtitle}</h1>
      <p className="mb-6 text-sm text-[var(--gov-muted)]">يرجى إدخال بياناتك بشكل صحيح للمتابعة.</p>

      <form
        className="space-y-4"
        onSubmit={async (e) => {
          e.preventDefault();
          setPend(true);
          setErr(null);
          const fd = new FormData(e.currentTarget);
          const res = await signIn("credentials", {
            identifier: String(fd.get("identifier") ?? "").trim(),
            password: String(fd.get("password")),
            portal,
            redirect: false,
          });
          setPend(false);
          if (res?.error) {
            setErr(
              isCitizen
                ? "بيانات غير صحيحة — تأكد من رقم الواتساب وكلمة المرور (حساب مواطن فقط)"
                : "بيانات غير صحيحة — البريد وكلمة المرور لحساب موظف أو مدير فقط",
            );
            return;
          }
          const after = safePostLoginRedirectPath(sp.get("next"), portal, staffPortalWeb);
          if (after) {
            router.push(after);
            router.refresh();
            return;
          }
          if (portal === "citizen") router.push("/citizen");
          else router.push(staffPortalWeb ? "/" : "/admin");
          router.refresh();
        }}
      >
        {err && (
          <p
            className={cn(
              "px-3 py-2 text-sm",
              isCitizen
                ? "rounded-xl border border-rose-200 bg-rose-50 text-rose-900"
                : "border border-[var(--gov-flag-red)]/40 bg-[var(--gov-flag-red)]/5 text-[var(--gov-text)]",
            )}
          >
            {err}
          </p>
        )}
        {sp.get("registered") && portal === "citizen" && (
          <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-900">
            تم إنشاء الحساب — يمكنك تسجيل الدخول الآن
          </p>
        )}
        <div>
          <label className="mb-1.5 block text-sm font-medium text-[var(--gov-text)]">{identifierLabel}</label>
          <input
            name="identifier"
            type="text"
            required
            autoComplete={identifierAutocomplete ?? "username"}
            placeholder={identifierPlaceholder}
            className={cn(
              "gov-input w-full px-3 py-2.5 text-sm outline-none focus:ring-2",
              isCitizen ? "focus:ring-emerald-600/35" : "focus:ring-1 focus:ring-[var(--gov-primary)]",
            )}
          />
        </div>
        <div>
          <label htmlFor={passwordFieldId} className="mb-1.5 block text-sm font-medium text-[var(--gov-text)]">
            كلمة المرور
          </label>
          <PasswordRevealField
            inputId={passwordFieldId}
            name="password"
            autoComplete="current-password"
            variant={isCitizen ? "emerald" : "gov"}
          />
        </div>
        <button
          type="submit"
          disabled={pend}
          className={cn(
            "w-full px-4 py-3 text-sm font-semibold disabled:opacity-60",
            isCitizen
              ? "rounded-xl bg-emerald-700 text-white shadow-sm transition hover:bg-emerald-800"
              : "gov-btn-primary",
          )}
        >
          {pend ? "جاري التحقق…" : "تسجيل الدخول"}
        </button>
      </form>

      {portal === "citizen" && (
        <p className="mt-6 text-center text-sm text-slate-600">
          ليس لديك حساب؟{" "}
          <Link className="font-semibold text-emerald-800 underline-offset-2 hover:underline" href="/register">
            إنشاء حساب جديد
          </Link>
        </p>
      )}

      {extraFooter}

      {portal === "staff" && (
        <p className="mt-8 border-t border-[var(--gov-border)] pt-4 text-center text-[0.7rem] leading-relaxed text-[var(--gov-muted)]">
          هذه البوابة للموظفين والمديرين فقط. لا يُستخدم حساب المواطن هنا — بوابة المواطنين منفصلة تماماً على المسارات العامة للموقع.
        </p>
      )}
    </div>
  );

  if (isCitizen) {
    return (
      <CitizenAuthShell
        headerAside={
          title?.trim() ? (
            <p className="text-sm font-semibold text-emerald-900">{title.trim()}</p>
          ) : undefined
        }
      >
        <main className="flex flex-1 justify-center px-4 py-10">{form}</main>
      </CitizenAuthShell>
    );
  }

  return (
    <div className="gov-page flex min-h-dvh flex-col">
      <header className="gov-header">
        <div className="gov-divider-flag mx-auto mb-2 max-w-3xl opacity-80" />
        <div className="mx-auto flex max-w-3xl flex-wrap items-center justify-center gap-4 px-4 py-5 sm:justify-between sm:py-6">
          <div className="flex items-center gap-3">
            <StateEmblem height={52} />
            <div className="text-start text-white">
              <p className="text-xs text-white/80">{PORTAL_SUBTITLE}</p>
              <p className="text-lg font-bold leading-snug">{ENTITY_NAME_AR}</p>
            </div>
          </div>
          <p className="w-full text-center text-sm text-white/90 sm:w-auto sm:text-start">{title}</p>
        </div>
      </header>
      <main className="flex flex-1 items-start justify-center px-4 py-10">{form}</main>
    </div>
  );
}
