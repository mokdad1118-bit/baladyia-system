"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useMemo, useState } from "react";
import { getSession } from "next-auth/react";
import { safePostLoginRedirectPath } from "@/lib/portal-paths";

function CitizenWelcomeScreenInner() {
  const router = useRouter();
  const sp = useSearchParams();
  const spQuery = sp.toString();
  const nextParam = useMemo(() => new URLSearchParams(spQuery).get("next"), [spQuery]);
  const [busy, setBusy] = useState(false);

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
        {/* img بدل next/image لتقليل وميض التحسين/التحميل قبل ظهور الشعار */}
        <img
          src="/images/syrian-republic-emblem.png"
          alt="الجمهورية العربية السورية — Syrian Arab Republic"
          width={288}
          height={352}
          fetchPriority="high"
          decoding="async"
          className="h-auto w-[min(72vw,288px)] object-contain"
        />
        <div className="space-y-3 text-[#C5B382]">
          <p className="text-lg font-medium leading-relaxed sm:text-xl">مرحباً بكم في منصة الخدمات الإلكترونية</p>
          <p className="text-base font-semibold sm:text-lg">مجلس مدينة بصرى الشام</p>
        </div>
        <button
          type="button"
          disabled={busy}
          onClick={() => void onStart()}
          className="mt-2 min-w-[200px] rounded-xl border-2 border-[#C5B382] bg-[#C5B382]/10 px-8 py-3.5 text-base font-bold text-[#C5B382] shadow-sm transition hover:bg-[#C5B382]/20 disabled:opacity-60"
        >
          {busy ? "يرجى الانتظار…" : "اضغط للبدء"}
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
