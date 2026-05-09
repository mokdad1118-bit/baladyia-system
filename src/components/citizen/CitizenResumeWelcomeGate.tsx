"use client";

import { useRouter, usePathname } from "next/navigation";
import { useEffect } from "react";
import { getSession } from "next-auth/react";
import { UserRole } from "@/generated/prisma/enums";
import {
  clearCitizenWelcomeGate,
  hasCitizenWelcomeGatePassed,
  pathNeedsCitizenWelcomeGate,
} from "@/lib/citizen-welcome-gate";

/**
 * بعد مغادرة التطبيق/الخلفية يُمسح «عبور الترحيب»؛ عند العودة مع جلسة مواطن يُوجَّه إلى /citizen/welcome
 * ثم يدخل التطبيق من «اضغط للبدء» دون شاشة الدخول.
 */
export function CitizenResumeWelcomeGate() {
  const router = useRouter();
  const pathname = usePathname() ?? "";

  useEffect(() => {
    const clear = () => clearCitizenWelcomeGate();
    window.addEventListener("pagehide", clear);
    const onVisibility = () => {
      if (document.visibilityState === "hidden") clear();
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      window.removeEventListener("pagehide", clear);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      const session = await getSession();
      if (cancelled) return;
      const role = session?.user?.role as UserRole | undefined;
      if (!session?.user || role !== UserRole.CITIZEN) return;
      if (hasCitizenWelcomeGatePassed()) return;

      const search = typeof window !== "undefined" ? window.location.search : "";
      const fullPath = `${pathname}${search}`;
      if (!pathNeedsCitizenWelcomeGate(fullPath)) return;

      router.replace(`/citizen/welcome?next=${encodeURIComponent(fullPath)}`);
    };

    void run();

    const onVisible = () => {
      if (document.visibilityState === "visible") void run();
    };
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      cancelled = true;
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [router, pathname]);

  return null;
}
