"use client";

import { useEffect } from "react";

const ADMIN_CACHE_RESET_KEY = "admin_pwa_cache_reset_v1";

function isRootPwaWorker(registration: ServiceWorkerRegistration): boolean {
  const rootScope = `${window.location.origin}/`;
  const activeScript =
    registration.active?.scriptURL ||
    registration.waiting?.scriptURL ||
    registration.installing?.scriptURL ||
    "";
  return registration.scope === rootScope && activeScript.endsWith("/sw.js");
}

export function AdminNoPwaCacheReset() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    if (sessionStorage.getItem(ADMIN_CACHE_RESET_KEY) === "1") return;

    let cancelled = false;

    async function resetAdminCaches() {
      let changed = false;

      const registrations = await navigator.serviceWorker.getRegistrations();
      await Promise.all(
        registrations.map(async (registration) => {
          if (!isRootPwaWorker(registration)) return;
          changed = true;
          await registration.unregister();
        }),
      );

      if ("caches" in window) {
        const names = await caches.keys();
        const adminSensitiveCaches = names.filter((name) =>
          /^(apis|pages|pages-rsc|pages-rsc-prefetch|next-data|next-static-js-assets|static-js-assets|start-url)$/.test(
            name,
          ),
        );
        if (adminSensitiveCaches.length > 0) changed = true;
        await Promise.all(adminSensitiveCaches.map((name) => caches.delete(name)));
      }

      if (!changed || cancelled) return;
      sessionStorage.setItem(ADMIN_CACHE_RESET_KEY, "1");
      window.location.reload();
    }

    void resetAdminCaches().catch((error) => {
      console.warn("[PWA] admin cache reset skipped:", error);
    });

    return () => {
      cancelled = true;
    };
  }, []);

  return null;
}
