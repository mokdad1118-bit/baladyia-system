"use client";

import { useEffect, type ReactNode } from "react";
import { cn } from "@/lib/cn";
import { CitizenBottomNav } from "./CitizenBottomNav";
import { CitizenAppBar } from "./CitizenAppBar";

/**
 * واجهة مخصصة للجوال للمواطن: شريط علوي مبسط، تبويب سفلي،
 * وإخفاء الهيدر/التذييل العام على الشاشات الصغيرة.
 */
export function CitizenMobileShell({
  children,
  isCitizen,
}: {
  children: ReactNode;
  isCitizen: boolean;
}) {
  useEffect(() => {
    if (!isCitizen) return;
    document.body.classList.add("citizen-mobile-citizen");
    return () => {
      document.body.classList.remove("citizen-mobile-citizen");
    };
  }, [isCitizen]);

  return (
    <div
      className={cn(
        "min-h-0",
        isCitizen &&
          "pt-[calc(3.5rem+env(safe-area-inset-top,0px))] pb-[calc(4.25rem+env(safe-area-inset-bottom,0px))] md:pt-0 md:pb-0",
      )}
    >
      {isCitizen && <CitizenAppBar />}
      <div
        className={cn(
          "min-w-0 max-w-full overflow-x-hidden px-3 md:px-0",
        )}
      >
        {children}
      </div>
      {isCitizen && <CitizenBottomNav />}
    </div>
  );
}
