"use client";

import { useEffect } from "react";

const ADMIN_CACHE_RESET_KEY = "admin_pwa_cache_reset_v2";

function isRootPwaWorker(registration: ServiceWorkerRegistration): boolean {
  const adminUrl = `${window.location.origin}/admin/`;
  const activeScript =
    registration.active?.scriptURL ||
    registration.waiting?.scriptURL ||
    registration.installing?.scriptURL ||
    "";
  return adminUrl.startsWith(registration.scope) && /\/sw\.js(?:$|\?)/.test(activeScript);
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
        const adminSensitiveCaches = names.filter(
          (name) =>
            /^(apis|pages|pages-rsc|pages-rsc-prefetch|next-data|next-static-js-assets|static-js-assets|start-url)$/.test(
              name,
            ) ||
            name.includes("workbox") ||
            name.includes("next-pwa"),
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
