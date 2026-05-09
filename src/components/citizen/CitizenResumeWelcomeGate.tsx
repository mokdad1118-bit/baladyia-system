"use client";

import { useEffect } from "react";
import { clearCitizenWelcomePassBeacon } from "@/lib/citizen-welcome-pass";

/**
 * عند مغادرة التطبيق/إخفاء الصفحة يُمسح كوكي عبور الترحيب؛ عند العودة يفرض الـ middleware شاشة الترحيب أولاً.
 */
export function CitizenResumeWelcomeGate() {
  useEffect(() => {
    const clear = () => clearCitizenWelcomePassBeacon();
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

  return null;
}
