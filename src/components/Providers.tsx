"use client";

import { Suspense, useEffect } from "react";
import { SessionProvider } from "next-auth/react";
import { usePathname, useSearchParams } from "next/navigation";
import { OfflineBanner } from "@/components/ui/OfflineBanner";
import { OneSignalClient } from "@/components/OneSignalClient";

/** بعد كل تنقل (مسار أو استعلام): إرجاع التمرير للأعلى حتى يظهر المحتوى الجديد فوراً */
function ScrollToTopOnNavigation() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [pathname, searchParams]);
  return null;
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <OfflineBanner />
      <OneSignalClient />
      <Suspense fallback={null}>
        <ScrollToTopOnNavigation />
      </Suspense>
      {children}
    </SessionProvider>
  );
}
