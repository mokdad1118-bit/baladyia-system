"use client";

import { useCallback, useEffect, useState } from "react";

const INTRO_STORAGE_KEY = "citizen_pwa_intro_v1";

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
  const mq = window.matchMedia("(display-mode: standalone)").matches;
  const ios = (window.navigator as Navigator & { standalone?: boolean }).standalone === true;
  return mq || ios;
}

function isIOS(): boolean {
  if (typeof window === "undefined") return false;
  const ua = window.navigator.userAgent;
  return /iPad|iPhone|iPod/.test(ua) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
}

function isAndroid(): boolean {
  if (typeof window === "undefined") return false;
  return /Android/i.test(navigator.userAgent);
}

function dismissIntro() {
  try {
    localStorage.setItem(INTRO_STORAGE_KEY, "1");
  } catch {
    /* ignore */
  }
}

export function CitizenPwaLayer() {
  const [introOpen, setIntroOpen] = useState(false);
  const [iosHelpOpen, setIosHelpOpen] = useState(false);
  const [deferred, setDeferred] = useState<BeforeInstallPromptEventLike | null>(null);
  const [installBusy, setInstallBusy] = useState(false);

  useEffect(() => {
    if (isStandalone()) return;

    const t = window.setTimeout(() => {
      try {
        if (!localStorage.getItem(INTRO_STORAGE_KEY)) setIntroOpen(true);
      } catch {
        setIntroOpen(true);
      }
    }, 0);

    const onBip = (e: Event) => {
      e.preventDefault();
      const promptEvent = e as BeforeInstallPromptEventLike;
      window.__daraaBeforeInstallPrompt = promptEvent;
      setDeferred(promptEvent);
      window.dispatchEvent(new Event("daraa:pwa-install-available"));
    };
    window.addEventListener("beforeinstallprompt", onBip);
    return () => {
      window.clearTimeout(t);
      window.removeEventListener("beforeinstallprompt", onBip);
    };
  }, []);

  const closeIntro = useCallback(() => {
    dismissIntro();
    setIntroOpen(false);
  }, []);

  const runAndroidInstall = useCallback(async () => {
    const promptEvent = deferred ?? window.__daraaBeforeInstallPrompt;
    if (!promptEvent) return;
    setInstallBusy(true);
    try {
      await promptEvent.prompt();
      await promptEvent.userChoice;
    } catch {
      /* ignore */
    } finally {
      window.__daraaBeforeInstallPrompt = null;
      setInstallBusy(false);
      setDeferred(null);
      closeIntro();
    }
  }, [deferred, closeIntro]);

  if (isStandalone()) return null;

  return (
    <>
      {introOpen && (
        <div
          className="fixed inset-0 z-[99998] flex items-end justify-center bg-black/45 p-3 sm:items-center"
          role="dialog"
          aria-modal="true"
          aria-labelledby="citizen-pwa-intro-title"
        >
          <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-t-xl border border-[var(--gov-border)] bg-white p-5 shadow-xl sm:rounded-xl">
            <h2 id="citizen-pwa-intro-title" className="text-lg font-bold text-[var(--gov-text)]">
              تثبيت تطبيق المواطن
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-[var(--gov-muted)]">
              يمكنك تثبيت البوابة على شاشتك الرئيسية لتفتح كتطبيق بملء الشاشة وبسرعة أكبر، دون شريط عنوان المتصفح.
            </p>
            <div className="mt-4 flex flex-col gap-2">
              {isAndroid() && deferred && (
                <button
                  type="button"
                  disabled={installBusy}
                  className="gov-btn-primary min-h-11 w-full rounded-sm border-0 px-4 py-2.5 text-sm font-semibold disabled:opacity-60"
                  style={{ backgroundColor: "#006c35" }}
                  onClick={() => void runAndroidInstall()}
                >
                  {installBusy ? "جاري التحميل…" : "تحميل التطبيق"}
                </button>
              )}
              {isAndroid() && !deferred && (
                <p className="rounded-md border border-[var(--gov-border)] bg-[#f7f8fa] px-3 py-2 text-xs text-[var(--gov-muted)]">
                  إذا لم يظهر زر التحميل، افتح القائمة في Chrome ثم اختر «تثبيت التطبيق» أو «إضافة إلى الشاشة الرئيسية» عند توفرها.
                </p>
              )}
              {isIOS() && (
                <button
                  type="button"
                  className="gov-btn-primary min-h-11 w-full rounded-sm border-0 px-4 py-2.5 text-sm font-semibold"
                  style={{ backgroundColor: "#006c35" }}
                  onClick={() => setIosHelpOpen(true)}
                >
                  إرشادات آيفون / آيباد
                </button>
              )}
              <button
                type="button"
                className="gov-btn-secondary min-h-11 w-full rounded-sm px-4 py-2.5 text-sm font-semibold"
                onClick={closeIntro}
              >
                متابعة في المتصفح
              </button>
            </div>
          </div>
        </div>
      )}

      {iosHelpOpen && (
        <div
          className="fixed inset-0 z-[99999] flex items-end justify-center bg-black/45 p-3 sm:items-center"
          role="dialog"
          aria-modal="true"
          aria-labelledby="citizen-pwa-ios-title"
        >
          <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-t-xl border border-[var(--gov-border)] bg-white p-5 shadow-xl sm:rounded-xl">
            <h2 id="citizen-pwa-ios-title" className="text-lg font-bold text-[var(--gov-text)]">
              إضافة إلى الشاشة الرئيسية (iOS)
            </h2>
            <ol className="mt-3 list-decimal space-y-2 ps-4 text-sm leading-relaxed text-[var(--gov-text)]">
              <li>اضغط زر <strong className="text-[var(--gov-primary)]">المشاركة</strong> <span dir="ltr">(□↑)</span> أسفل شريط Safari.</li>
              <li>
                مرّر للأسفل واختر <strong>إضافة إلى الشاشة الرئيسية</strong>{" "}
                <span dir="ltr">(Add to Home Screen)</span>.
              </li>
              <li>ثم اضغط <strong>إضافة</strong> في الأعلى.</li>
            </ol>
            <p className="mt-3 text-xs text-[var(--gov-muted)]">
              لا يدعم Safari على iOS زر التثبيت التلقائي؛ هذه هي الطريقة الرسمية من Apple.
            </p>
            <button
              type="button"
              className="gov-btn-primary mt-4 min-h-11 w-full rounded-sm border-0 px-4 py-2.5 text-sm font-semibold"
              style={{ backgroundColor: "#006c35" }}
              onClick={() => {
                setIosHelpOpen(false);
                closeIntro();
              }}
            >
              فهمت
            </button>
          </div>
        </div>
      )}

      {!introOpen && isAndroid() && deferred && (
        <div className="fixed bottom-[calc(4.5rem+env(safe-area-inset-bottom,0px))] left-3 right-3 z-[99990] md:bottom-6 md:left-auto md:right-6 md:w-72">
          <div className="flex items-center gap-2 rounded-lg border border-[var(--gov-border)] bg-white p-2 shadow-lg">
            <button
              type="button"
              disabled={installBusy}
              className="gov-btn-primary min-h-10 flex-1 rounded-sm border-0 px-3 text-sm font-semibold"
              style={{ backgroundColor: "#006c35" }}
              onClick={() => void runAndroidInstall()}
            >
              {installBusy ? "…" : "تحميل التطبيق"}
            </button>
            <button
              type="button"
              className="text-xs text-[var(--gov-muted)] underline"
              onClick={() => setDeferred(null)}
            >
              لاحقاً
            </button>
          </div>
        </div>
      )}

      {!introOpen && isIOS() && !isStandalone() && (
        <IosShareHintOnce />
      )}
    </>
  );
}

/** تلميح خفيف بعد إغلاق المقدمة — مرة واحدة لكل جلسة */
function IosShareHintOnce() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!isIOS() || isStandalone()) return;
    try {
      if (sessionStorage.getItem("citizen_pwa_ios_banner")) return;
      sessionStorage.setItem("citizen_pwa_ios_banner", "1");
      const openTimer = window.setTimeout(() => setOpen(true), 0);
      const t = window.setTimeout(() => setOpen(false), 12000);
      return () => {
        window.clearTimeout(openTimer);
        window.clearTimeout(t);
      };
    } catch {
      const t = window.setTimeout(() => setOpen(true), 0);
      return () => window.clearTimeout(t);
    }
  }, []);

  if (!open) return null;

  return (
    <div className="fixed bottom-[calc(4.5rem+env(safe-area-inset-bottom,0px))] left-3 right-3 z-[99989] md:bottom-6 md:left-auto md:right-6 md:max-w-sm">
      <div className="rounded-lg border border-[var(--gov-border)] bg-[#f0faf4] px-3 py-2 text-xs text-[var(--gov-text)] shadow-md">
        <strong className="text-[#006c35]">آيفون:</strong> من زر المشاركة ↑ ثم «إضافة إلى الشاشة الرئيسية».
        <button type="button" className="ms-2 underline" onClick={() => setOpen(false)}>
          إغلاق
        </button>
      </div>
    </div>
  );
}
