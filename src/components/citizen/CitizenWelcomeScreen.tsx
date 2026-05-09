"use client";

import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo } from "react";
import { getSession } from "next-auth/react";
import { safePostLoginRedirectPath } from "@/lib/portal-paths";

function CitizenWelcomeScreenInner() {
  const router = useRouter();
  const sp = useSearchParams();
  const spQuery = sp.toString();
  const nextParam = useMemo(() => new URLSearchParams(spQuery).get("next"), [spQuery]);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    let cancelled = false;

    void (async () => {
      const session = await getSession();
      if (cancelled) return;
      if (session?.user) {
        const dest = safePostLoginRedirectPath(nextParam, "citizen") ?? "/citizen";
        router.replace(dest);
        return;
      }
      timer = setTimeout(() => {
        router.replace(`/citizen/login${spQuery ? `?${spQuery}` : ""}`);
      }, 2000);
    })();

    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [router, nextParam, spQuery]);

  return (
    <div
      dir="rtl"
      className="flex min-h-dvh flex-col items-center justify-center gap-8 bg-[#0B2B26] px-6 py-12 text-center"
    >
      <div className="flex max-w-md flex-col items-center gap-6">
        <Image
          src="/images/syrian-republic-emblem.png"
          alt="الجمهورية العربية السورية — Syrian Arab Republic"
          width={288}
          height={352}
          priority
          className="h-auto w-[min(72vw,288px)] object-contain"
        />
        <div className="space-y-3 text-[#C5B382]">
          <p className="text-lg font-medium leading-relaxed sm:text-xl">مرحباً بكم في منصة الخدمات الإلكترونية</p>
          <p className="text-base font-semibold sm:text-lg">مجلس مدينة بصرى الشام</p>
        </div>
      </div>
    </div>
  );
}

export function CitizenWelcomeScreen() {
  return (
    <Suspense
      fallback={
        <div className="min-h-dvh bg-[#0B2B26]" aria-hidden />
      }
    >
      <CitizenWelcomeScreenInner />
    </Suspense>
  );
}
