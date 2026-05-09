"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useMemo, useState } from "react";
import { getSession } from "next-auth/react";
import { safePostLoginRedirectPath } from "@/lib/portal-paths";
import { cn } from "@/lib/cn";

function CitizenWelcomeScreenInner() {
  const router = useRouter();
  const sp = useSearchParams();
  const spQuery = sp.toString();
  const nextParam = useMemo(() => new URLSearchParams(spQuery).get("next"), [spQuery]);
  const [busy, setBusy] = useState(false);
  const [emblemReady, setEmblemReady] = useState(false);

  const onStart = useCallback(async () => {
    setBusy(true);
    try {
      const session = await getSession();
      if (session?.user) {
        const dest = safePostLoginRedirectPath(nextParam, "citizen") ?? "/citizen";
        router.replace(dest);
      } else {
        router.replace(`/citizen/login${spQuery ? `?${spQuery}` : ""}`);
      }
    } catch {
      setBusy(false);
    }
  }, [router, nextParam, spQuery]);

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-10 px-6 py-12 text-center">
      <div className="flex max-w-md flex-col items-center gap-6">
        <img
          src="/images/syrian-republic-emblem.png"
          alt="الجمهورية العربية السورية — النسر والشعار الرسمي والنصان العربي والإنكليزي"
          width={380}
          height={420}
          fetchPriority="high"
          decoding="async"
          onLoad={() => setEmblemReady(true)}
          className={cn(
            "h-auto max-h-[min(52vh,440px)] w-full max-w-[min(92vw,380px)] object-contain transition-opacity duration-700 ease-out",
            emblemReady ? "opacity-100" : "opacity-0",
          )}
        />
        <div className="space-y-3 text-[#C5B382]">
          <p className="text-lg font-medium leading-relaxed sm:text-xl">مرحباً بكم في منصة الخدمات الإلكترونية</p>
          <p className="text-base font-semibold sm:text-lg">مجلس مدينة بصرى الشام</p>
        </div>
        <button
          type="button"
          disabled={busy}
          onClick={() => void onStart()}
          className={cn(
            "citizen-welcome-start-btn rounded-full px-10 py-4 text-base font-bold tracking-wide transition-transform duration-200",
            "min-w-[220px] disabled:pointer-events-none disabled:opacity-55",
          )}
        >
          <span className="citizen-welcome-start-btn__glow" aria-hidden />
          <span className="citizen-welcome-start-btn__shine" aria-hidden>
            <span className="citizen-welcome-start-btn__shine-inner" />
          </span>
          <span className="relative z-[1]">{busy ? "يرجى الانتظار…" : "اضغط للبدء"}</span>
        </button>
      </div>
    </div>
  );
}

export function CitizenWelcomeScreen() {
  return (
    <Suspense fallback={<div className="min-h-dvh bg-[#0B2B26]" aria-hidden />}>
      <CitizenWelcomeScreenInner />
    </Suspense>
  );
}
