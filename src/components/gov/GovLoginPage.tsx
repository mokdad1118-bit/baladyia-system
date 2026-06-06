"use client";

import { Suspense, useId, useState } from "react";
import { getSession, signIn, type SignInResponse } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import type { LoginPageSurface } from "@/lib/auth-portal";
import { safePostLoginRedirectPath } from "@/lib/portal-paths";
import { StateEmblem } from "@/components/gov/StateEmblem";
import { ENTITY_NAME_AR, PORTAL_SUBTITLE, SUPERVISING_AUTHORITY_AR } from "@/lib/entity";
import { CitizenAuthShell } from "@/components/citizen/CitizenAuthShell";
import Link from "next/link";
import { cn } from "@/lib/cn";
import { navigateTopLevel } from "@/lib/navigate-client";
import { AsyncWaitOverlay } from "@/components/ui/AsyncWaitOverlay";
import { PasswordRevealField } from "@/components/PasswordRevealField";
import { UserRole } from "@/generated/prisma/enums";
import { grantCitizenWelcomePassClient } from "@/lib/citizen-welcome-pass";

export type GovLoginPageProps = {
  loginPage: LoginPageSurface;
  title?: string;
  subtitle: string;
  identifierLabel: string;
  identifierPlaceholder: string;
  identifierAutocomplete?: string;
  extraFooter?: React.ReactNode;
  staffPortalWeb?: boolean;
};

function isSignInSuccess(res: SignInResponse): boolean {
  return res.ok === true && !res.error;
}

function failureMessageForSignIn(loginPage: LoginPageSurface, res: SignInResponse): string {
  if (res.status >= 500) {
    return "حدث خطأ في الخادم (500). حاول بعد قليل أو حدّث الصفحة.";
  }
  if (res.status === 401) {
    return loginPage === "citizen"
      ? "رقم الهاتف أو كلمة المرور غير صحيحة"
      : "البريد الإلكتروني أو كلمة المرور غير صحيحة";
  }
  return loginPage === "citizen"
    ? "رقم الهاتف أو كلمة المرور غير صحيحة"
    : "البريد الإلكتروني أو كلمة المرور غير صحيحة";
}

function employeeHasAdminPanelPermission(user: NonNullable<Awaited<ReturnType<typeof getSession>>>["user"] | undefined): boolean {
  return Boolean(
    user?.permViewRequests ||
      user?.permManageGas ||
      user?.permManageSocialServices ||
      user?.permManageInPersonRequests ||
      user?.permManageCitizenFeedback ||
      user?.permViewCitizens ||
      user?.permViewOperationLog ||
      user?.permManageServices ||
      user?.permManageUsers ||
      user?.permViewStats ||
      user?.permManageAreaNews ||
      user?.permManageArchive,
  );
}

/**
 * ثلاث صفحات دخول: /citizen/login و /staff/login و /admin/login
 * والتحقق من صلاحية الدخول حسب الدور في الخادم (credentials.loginPage).
 */
function GovLoginPageImpl({
  loginPage,
  title,
  subtitle,
  identifierLabel,
  identifierPlaceholder,
  identifierAutocomplete,
  extraFooter,
  staffPortalWeb,
}: GovLoginPageProps) {
  const sp = useSearchParams();
  const [err, setErr] = useState<string | null>(null);
  const [pend, setPend] = useState(false);
  const passwordFieldId = useId();
  const isCitizen = loginPage === "citizen";
  const [identifier, setIdentifier] = useState(() => (isCitizen ? (sp.get("identifier")?.trim() ?? "") : ""));
  const [password, setPassword] = useState("");

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
          const idTrim = identifier.trim();
          try {
            const res = await signIn("credentials", {
              identifier: idTrim,
              password,
              loginPage: String(loginPage),
              redirect: false,
            });
            if (process.env.NODE_ENV === "development") {
              console.log("[credentials signIn response]", res);
            }
            if (res == null || typeof res !== "object") {
              setErr("تعذّر إكمال تسجيل الدخول. حدّث الصفحة وحاول مرة أخرى.");
              return;
            }
            if (!isSignInSuccess(res)) {
              setErr(failureMessageForSignIn(loginPage, res));
              return;
            }
            const after = safePostLoginRedirectPath(sp.get("next"), loginPage, staffPortalWeb);
            await getSession();
            await fetch(`${window.location.origin}/api/auth/session`, {
              credentials: "include",
              cache: "no-store",
            });
            const session = await getSession();
            const role = session?.user?.role as UserRole | undefined;
            let dest = after ?? null;
            if (!dest) {
              if (role === UserRole.CITIZEN) dest = "/citizen";
              else if (role === UserRole.GAS_AGENT) dest = "/gas-agent";
              else if (role === UserRole.EMPLOYEE) dest = employeeHasAdminPanelPermission(session?.user) ? "/admin" : "/staff";
              else if (role === UserRole.SUPER_ADMIN || role === UserRole.MUNICIPALITY_ADMIN) dest = "/admin";
              else dest = loginPage === "citizen" ? "/citizen" : loginPage === "staff" ? "/staff" : "/admin";
            }
            const absolute = new URL(dest, window.location.origin).href;
            if (role === UserRole.CITIZEN) {
              await grantCitizenWelcomePassClient();
            }
            await new Promise((r) => setTimeout(r, 120));
            navigateTopLevel(absolute);
          } catch (caught) {
            console.error("[credentials signIn]", caught);
            setErr("تعذّر الاتصال بالخادم. تحقق من الشبكة وحاول مرة أخرى.");
          } finally {
            setPend(false);
          }
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
        {sp.get("registered") && loginPage === "citizen" && (
          <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-900">
            أكمل تفعيل الحساب من البريد ثم سجّل الدخول برقم الهاتف وكلمة المرور.
          </p>
        )}
        {sp.get("verified") && loginPage === "citizen" && (
          <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-900">
            تم تفعيل الحساب بنجاح — يمكنك تسجيل الدخول الآن.
          </p>
        )}
        {sp.get("reset") && loginPage === "citizen" && (
          <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-900">
            تم تحديث كلمة المرور — سجّل الدخول باستخدام الرقم الجديد.
          </p>
        )}
        {sp.get("config") && loginPage === "citizen" && (
          <p className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-950">
            إعداد الخادم غير مكتمل: أضف <strong>AUTH_SECRET</strong> أو <strong>NEXTAUTH_SECRET</strong> أو{" "}
            <strong>JWT_SECRET</strong> في متغيرات البيئة على Vercel ثم أعد النشر.
          </p>
        )}
        <div>
          <label className="mb-1.5 block text-sm font-medium text-[var(--gov-text)]">{identifierLabel}</label>
          <input
            name="identifier"
            type="text"
            required
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
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
            value={password}
            onValueChange={setPassword}
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
          {pend ? "يرجى الانتظار…" : "تسجيل الدخول"}
        </button>
      </form>

      {loginPage === "citizen" && (
        <div className="mt-6 space-y-3 text-center text-sm text-slate-600">
          <p>
            ليس لديك حساب؟{" "}
            <Link className="font-semibold text-emerald-800 underline-offset-2 hover:underline" href="/register">
              إنشاء حساب جديد
            </Link>
          </p>
          <p>
            <Link
              className="font-medium text-emerald-900/90 underline-offset-2 hover:underline"
              href="/citizen/forgot-password"
            >
              نسيت كلمة المرور؟
            </Link>
          </p>
        </div>
      )}

      {extraFooter}
    </div>
  );

  const waitOverlay = <AsyncWaitOverlay active={pend} variant={isCitizen ? "emerald" : "gov"} />;

  if (isCitizen) {
    return (
      <>
        <CitizenAuthShell
          headerAside={
            title?.trim() ? (
              <p className="text-sm font-semibold text-emerald-900">{title.trim()}</p>
            ) : undefined
          }
        >
          <main className="flex flex-1 justify-center px-4 py-10">{form}</main>
        </CitizenAuthShell>
        {waitOverlay}
      </>
    );
  }

  return (
    <>
      <div className="gov-page flex min-h-dvh flex-col">
        <header className="gov-header">
          <div className="gov-divider-flag mx-auto mb-2 max-w-3xl opacity-80" />
          <div className="mx-auto flex max-w-3xl flex-wrap items-center justify-center gap-4 px-4 py-5 sm:justify-between sm:py-6">
            <div className="flex items-center gap-3">
              <StateEmblem height={58} />
              <div className="text-start text-white">
                <p className="text-xs text-white/80">{PORTAL_SUBTITLE}</p>
                <p className="text-lg font-bold leading-snug">{ENTITY_NAME_AR}</p>
                <p className="text-[0.7rem] text-white/75">{SUPERVISING_AUTHORITY_AR}</p>
              </div>
            </div>
            <p className="w-full text-center text-sm text-white/90 sm:w-auto sm:text-start">{title}</p>
          </div>
        </header>
        <main className="flex flex-1 items-start justify-center px-4 py-10">{form}</main>
      </div>
      {waitOverlay}
    </>
  );
}

function GovLoginPageFallback({ loginPage }: { loginPage: LoginPageSurface }) {
  const isCitizen = loginPage === "citizen";
  if (isCitizen) {
    return (
      <CitizenAuthShell>
        <main className="flex flex-1 justify-center px-4 py-10">
          <p className="text-sm text-slate-600">جاري التحميل…</p>
        </main>
      </CitizenAuthShell>
    );
  }
  return (
    <div className="gov-page flex min-h-dvh flex-col">
      <header className="gov-header">
        <div className="gov-divider-flag mx-auto mb-2 max-w-3xl opacity-80" />
      </header>
      <main className="flex flex-1 items-center justify-center px-4 py-10">
        <p className="text-sm text-[var(--gov-muted)]">جاري التحميل…</p>
      </main>
    </div>
  );
}

export function GovLoginPage(props: GovLoginPageProps) {
  return (
    <Suspense fallback={<GovLoginPageFallback loginPage={props.loginPage} />}>
      <GovLoginPageImpl {...props} />
    </Suspense>
  );
}
