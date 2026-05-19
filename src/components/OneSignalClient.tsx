"use client";

import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { UserRole } from "@/generated/prisma/enums";

const DARAa_ONESIGNAL_APP_ID = "30f2deb1-debf-4b7c-80c0-0d11dd28f01d";

type OneSignalSdk = {
  init: (options: Record<string, unknown>) => Promise<void>;
  login: (externalId: string) => Promise<void>;
  logout: () => Promise<void>;
  User: {
    addTags: (tags: Record<string, string>) => Promise<void> | void;
  };
  Notifications: {
    isPushSupported?: () => boolean;
    requestPermission: () => Promise<boolean | void> | boolean | void;
  };
};

declare global {
  interface Window {
    OneSignalDeferred?: Array<(OneSignal: OneSignalSdk) => void | Promise<void>>;
    __daraaOneSignalInitialized?: boolean;
    __daraaOneSignalInitFailed?: boolean;
  }
}

function onesignalRole(role: UserRole): string {
  if (role === UserRole.SUPER_ADMIN) return "governorate_admin";
  if (role === UserRole.MUNICIPALITY_ADMIN) return "municipality_admin";
  if (role === UserRole.EMPLOYEE) return "employee";
  if (role === UserRole.GAS_AGENT) return "gas_agent";
  return "citizen";
}

export function OneSignalClient() {
  const { data: session, status } = useSession();

  useEffect(() => {
    const appId = process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID || DARAa_ONESIGNAL_APP_ID;
    if (!appId || typeof window === "undefined") return;

    window.OneSignalDeferred = window.OneSignalDeferred || [];
    window.OneSignalDeferred.push(async (OneSignal) => {
      if (window.__daraaOneSignalInitFailed) return;
      if (!window.__daraaOneSignalInitialized) {
        try {
          await OneSignal.init({
            appId,
            serviceWorkerPath: "OneSignalSDKWorker.js",
          });
          window.__daraaOneSignalInitialized = true;
        } catch (error) {
          const message = error instanceof Error ? error.message : "";
          if (/already initialized/i.test(message)) {
            window.__daraaOneSignalInitialized = true;
          } else {
            window.__daraaOneSignalInitFailed = true;
            console.warn("[OneSignal] init skipped:", message || error);
            return;
          }
        }
      }

      if (status === "unauthenticated") {
        await OneSignal.logout();
        return;
      }

      const user = session?.user;
      if (status !== "authenticated" || !user?.id || !user.role) return;

      const role = onesignalRole(user.role);
      await OneSignal.login(user.id);
      await OneSignal.User.addTags({
        governorate: "daraa",
        municipalityId: user.municipalityId?.trim() || "all",
        role,
      });

      if (user.role !== UserRole.CITIZEN) return;
      if (OneSignal.Notifications.isPushSupported && !OneSignal.Notifications.isPushSupported()) return;
      if (typeof Notification === "undefined") return;
      if (Notification.permission !== "default") return;

      const storageKey = `daraa-push-permission-asked:${user.id}`;
      if (window.localStorage.getItem(storageKey)) return;
      window.localStorage.setItem(storageKey, "1");
      await OneSignal.Notifications.requestPermission();
    });
  }, [session?.user?.id, session?.user?.municipalityId, session?.user?.role, status]);

  return null;
}
