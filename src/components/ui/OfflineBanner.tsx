"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/cn";

/** شريط علوي عند انقطاع الشبكة في المتصفح */
export function OfflineBanner() {
  const [online, setOnline] = useState(true);

  useEffect(() => {
    const sync = () => setOnline(typeof navigator !== "undefined" ? navigator.onLine : true);
    sync();
    window.addEventListener("online", sync);
    window.addEventListener("offline", sync);
    return () => {
      window.removeEventListener("online", sync);
      window.removeEventListener("offline", sync);
    };
  }, []);

  if (online) return null;

  return (
    <div
      className={cn(
        "fixed start-0 end-0 top-0 z-[110] border-b border-amber-800/25 bg-amber-50 px-4 py-2.5 text-center text-sm font-medium text-amber-950 shadow-sm",
      )}
      role="alert"
      dir="rtl"
    >
      لا يوجد اتصال بالإنترنت. يرجى التحقق من الشبكة ثم المحاولة مرة أخرى.
    </div>
  );
}
