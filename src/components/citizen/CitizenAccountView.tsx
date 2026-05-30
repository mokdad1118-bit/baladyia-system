"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type OneSignalAccountSdk = {
  User?: {
    PushSubscription?: {
      optIn?: () => Promise<void> | void;
      optedIn?: boolean;
    };
  };
  Notifications?: {
    requestPermission?: () => Promise<boolean | void> | boolean | void;
  };
  Slidedown?: {
    promptPush?: () => Promise<void> | void;
  };
};

type BeforeInstallPromptEventLike = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

declare global {
  interface Window {
    __daraaBeforeInstallPrompt?: BeforeInstallPromptEventLike | null;
  }
}

function isStandalone(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

function isIOS(): boolean {
  if (typeof window === "undefined") return false;
  const ua = window.navigator.userAgent;
  return /iPad|iPhone|iPod/.test(ua) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
}

function notificationStatusText(): string {
  if (typeof window === "undefined" || typeof Notification === "undefined") return "الإشعارات غير مدعومة على هذا المتصفح.";
  if (Notification.permission === "granted") return "الإشعارات مفعّلة على هذا الجهاز.";
  if (Notification.permission === "denied") return "الإشعارات محظورة من إعدادات المتصفح.";
  return "يمكنك تفعيل الإشعارات لاستقبال التنبيهات على هذا الجهاز.";
}

export function CitizenAccountView({
  user,
  passwordRecoveryHref = "/citizen/forgot-password",
}: {
  user: {
    name: string | null;
    email: string | null;
    phone: string | null;
    nationalId: string | null;
    notificationEmail: string | null;
    createdAt: string;
    municipalityName?: string | null;
  };
  /** صفحة استعادة/تغيير كلمة المرور (لا يُعرض النص الفعلي لأسباب أمنية) */
  passwordRecoveryHref?: string;
}) {
  const [showPasswordInfo, setShowPasswordInfo] = useState(false);
  const [installAvailable, setInstallAvailable] = useState(() =>
    typeof window !== "undefined" ? Boolean(window.__daraaBeforeInstallPrompt) : false,
  );
  const [installStatus, setInstallStatus] = useState("");
  const [installBusy, setInstallBusy] = useState(false);
  const [notificationStatus, setNotificationStatus] = useState(notificationStatusText);
  const [notificationBusy, setNotificationBusy] = useState(false);

  useEffect(() => {
    const onInstallAvailable = () => setInstallAvailable(Boolean(window.__daraaBeforeInstallPrompt));
    window.addEventListener("daraa:pwa-install-available", onInstallAvailable);
    return () => window.removeEventListener("daraa:pwa-install-available", onInstallAvailable);
  }, []);

  async function installApp() {
    if (isStandalone()) {
      setInstallStatus("التطبيق مثبت ومفتوح حالياً كتطبيق مستقل.");
      return;
    }

    const promptEvent = window.__daraaBeforeInstallPrompt;
    if (!promptEvent) {
      setInstallStatus(
        isIOS()
          ? "على iPhone أو iPad: افتح زر المشاركة ثم اختر إضافة إلى الشاشة الرئيسية."
          : "إذا لم يظهر زر التثبيت، افتح قائمة المتصفح واختر تثبيت التطبيق أو إضافة إلى الشاشة الرئيسية.",
      );
      return;
    }

    setInstallBusy(true);
    try {
      await promptEvent.prompt();
      const choice = await promptEvent.userChoice;
      window.__daraaBeforeInstallPrompt = null;
      setInstallAvailable(false);
      setInstallStatus(choice.outcome === "accepted" ? "تم إرسال طلب تثبيت التطبيق." : "تم إلغاء تثبيت التطبيق.");
    } catch {
      setInstallStatus("تعذر فتح نافذة التثبيت. استخدم قائمة المتصفح لتثبيت التطبيق.");
    } finally {
      setInstallBusy(false);
    }
  }

  async function enableNotifications() {
    if (typeof window === "undefined" || typeof Notification === "undefined") {
      setNotificationStatus("الإشعارات غير مدعومة على هذا المتصفح.");
      return;
    }
    if (Notification.permission === "denied") {
      setNotificationStatus("الإشعارات محظورة. فعّلها من إعدادات الموقع داخل المتصفح.");
      return;
    }

    setNotificationBusy(true);
    setNotificationStatus("جاري طلب تفعيل الإشعارات...");
    const w = window as Window & {
      OneSignalDeferred?: Array<(OneSignal: OneSignalAccountSdk) => void | Promise<void>>;
    };
    w.OneSignalDeferred = w.OneSignalDeferred || [];
    w.OneSignalDeferred.push(async (OneSignal) => {
      try {
        if (OneSignal.Slidedown?.promptPush) {
          await OneSignal.Slidedown.promptPush();
        } else {
          await OneSignal.Notifications?.requestPermission?.();
        }
        if (Notification.permission === "granted") {
          await OneSignal.User?.PushSubscription?.optIn?.();
        }
        setNotificationStatus(notificationStatusText());
      } catch {
        setNotificationStatus("تعذر تفعيل الإشعارات. حاول مرة أخرى أو تحقق من إعدادات المتصفح.");
      } finally {
        setNotificationBusy(false);
      }
    });
  }

  const rows: { label: string; value: string }[] = [
    { label: "البلدية", value: user.municipalityName ?? "—" },
    { label: "الاسم الثلاثي", value: user.name ?? "—" },
    { label: "البريد الإلكتروني", value: user.email ?? "—" },
    { label: "رقم الهاتف", value: user.phone ?? "—" },
    { label: "الرقم الوطني", value: user.nationalId ?? "—" },
    { label: "بريد الإشعارات", value: user.notificationEmail ?? "—" },
    { label: "تاريخ إنشاء الحساب", value: new Date(user.createdAt).toLocaleDateString("ar") },
  ];

  return (
    <div className="gov-card p-4 md:p-6">
      <h1 className="mb-1 text-lg font-bold text-[var(--gov-text)] md:text-xl">حسابي</h1>
      <p className="mb-4 text-sm text-[var(--gov-muted)]">عرض بيانات الحساب فقط (غير قابل للتعديل).</p>

      <div className="mb-4 grid gap-3 md:grid-cols-2">
        <div className="rounded-xl border border-[var(--gov-border)] p-3">
          <p className="mb-1 text-sm font-medium text-[var(--gov-text)]">الإشعارات</p>
          <p className="mb-3 min-h-8 text-xs leading-relaxed text-[var(--gov-muted)]">{notificationStatus}</p>
          <button
            type="button"
            disabled={notificationBusy || notificationStatus.includes("مفعّلة")}
            onClick={() => void enableNotifications()}
            className="gov-btn-primary min-h-10 w-full rounded-sm px-3 py-2 text-sm font-semibold disabled:opacity-60"
          >
            {notificationBusy ? "جاري التفعيل..." : "تفعيل الإشعارات"}
          </button>
        </div>

        <div className="rounded-xl border border-[var(--gov-border)] p-3">
          <p className="mb-1 text-sm font-medium text-[var(--gov-text)]">تثبيت التطبيق</p>
          <p className="mb-3 min-h-8 text-xs leading-relaxed text-[var(--gov-muted)]">
            {installStatus || (installAvailable ? "زر التثبيت جاهز لهذا الجهاز." : "ثبّت التطبيق للوصول السريع من الشاشة الرئيسية.")}
          </p>
          <button
            type="button"
            disabled={installBusy}
            onClick={() => void installApp()}
            className="gov-btn-secondary min-h-10 w-full rounded-sm px-3 py-2 text-sm font-semibold disabled:opacity-60"
          >
            {installBusy ? "جاري فتح التثبيت..." : "تثبيت التطبيق"}
          </button>
        </div>
      </div>

      <div className="mb-4 rounded-xl border border-[var(--gov-border)] p-3">
        <p className="mb-2 text-sm font-medium text-[var(--gov-text)]">كلمة السر</p>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            {showPasswordInfo ? (
              <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:gap-3">
                <p className="text-xs font-semibold text-[var(--gov-text)]">إعادة تعيين كلمة السر</p>
                <Link
                  href={passwordRecoveryHref}
                  className="gov-btn-primary inline-flex min-h-9 w-fit items-center justify-center rounded-sm px-3 py-1.5 text-xs font-semibold no-underline"
                >
                  الانتقال لإعادة تعيين كلمة السر
                </Link>
              </div>
            ) : (
              <code
                className="inline-block rounded bg-slate-100 px-2 py-1.5 text-base tracking-widest text-slate-700"
                aria-hidden
              >
                ••••••••••••
              </code>
            )}
          </div>
          <button
            type="button"
            aria-pressed={showPasswordInfo}
            onClick={() => setShowPasswordInfo((v) => !v)}
            className="shrink-0 rounded-lg border border-[var(--gov-border)] bg-white px-3 py-1.5 text-xs font-semibold text-[var(--gov-primary)] hover:bg-[#f7faf8]"
          >
            {showPasswordInfo ? "إخفاء كلمة السر" : "إظهار كلمة السر"}
          </button>
        </div>
      </div>

      <div className="gov-table-wrap">
        <table className="gov-table">
          <tbody>
            {rows.map((r) => (
              <tr key={r.label}>
                <th className="w-[12rem]">{r.label}</th>
                <td dir={r.label.includes("رقم") ? "ltr" : "auto"}>{r.value}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
