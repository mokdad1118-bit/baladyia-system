"use client";

import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { UserRole } from "@/generated/prisma/enums";
import { APP_NAME_AR } from "@/lib/entity";

const DARAA_ONESIGNAL_APP_ID = "30f2deb1-debf-4b7c-80c0-0d11dd28f01d";

type OneSignalSdk = {
  init: (options: Record<string, unknown>) => Promise<void>;
  login: (externalId: string) => Promise<void>;
  logout: () => Promise<void>;
  User: {
    addTags: (tags: Record<string, string>) => Promise<void> | void;
    PushSubscription: {
      addEventListener: (
        event: "change",
        listener: (event: { current?: { id?: string | null; token?: string | null; optedIn?: boolean } }) => void,
      ) => void;
      optIn: () => Promise<void> | void;
      optedIn?: boolean;
    };
  };
  Notifications: {
    isPushSupported?: () => boolean;
    requestPermission: () => Promise<boolean | void> | boolean | void;
    setDefaultTitle?: (title: string) => void;
    setDefaultUrl?: (url: string) => void;
    permission?: boolean;
  };
  Slidedown?: {
    promptPush: () => Promise<void> | void;
  };
};

declare global {
  interface Window {
    OneSignalDeferred?: Array<(OneSignal: OneSignalSdk) => void | Promise<void>>;
    __daraaOneSignalInitialized?: boolean;
    __daraaOneSignalInitFailed?: boolean;
    __daraaOneSignalSubscriptionListener?: boolean;
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
  const userId = session?.user?.id;
  const userMunicipalityId = session?.user?.municipalityId;
  const userRole = session?.user?.role;

  useEffect(() => {
    const appId = process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID || DARAA_ONESIGNAL_APP_ID;
    if (!appId || typeof window === "undefined") return;

    window.OneSignalDeferred = window.OneSignalDeferred || [];
    window.OneSignalDeferred.push(async (OneSignal) => {
      if (window.__daraaOneSignalInitFailed) return;
      if (!window.__daraaOneSignalInitialized) {
        const origin = window.location.origin;
        try {
          await OneSignal.init({
            appId,
            serviceWorkerPath: "OneSignalSDKWorker.js",
            serviceWorkerParam: { scope: "/" },
            notificationClickHandlerMatch: "origin",
            notificationClickHandlerAction: "focus",
            welcomeNotification: {
              title: APP_NAME_AR,
              message: "تم تفعيل إشعارات بوابة محافظة درعا.",
              url: "/citizen/notifications",
            },
          });
          OneSignal.Notifications.setDefaultTitle?.(APP_NAME_AR);
          OneSignal.Notifications.setDefaultUrl?.(new URL("/citizen/notifications", origin).toString());
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

      if (status !== "authenticated" || !userId || !userRole) return;

      const role = onesignalRole(userRole);
      const tags = {
        governorate: "daraa",
        municipalityId: userMunicipalityId?.trim() || "all",
        role,
      };
      const identifyUser = async () => {
        await OneSignal.login(userId);
        await OneSignal.User.addTags(tags);
      };

      await identifyUser();
      if (!window.__daraaOneSignalSubscriptionListener) {
        OneSignal.User.PushSubscription.addEventListener("change", () => {
          void identifyUser();
        });
        window.__daraaOneSignalSubscriptionListener = true;
      }

      if (userRole !== UserRole.CITIZEN) return;
      if (OneSignal.Notifications.isPushSupported && !OneSignal.Notifications.isPushSupported()) return;
      if (typeof Notification === "undefined") return;
      if (OneSignal.User.PushSubscription.optedIn) return;

      if (Notification.permission === "granted") {
        await OneSignal.User.PushSubscription.optIn();
        await identifyUser();
        return;
      }
      if (Notification.permission !== "default") return;

      if (OneSignal.Slidedown?.promptPush) {
        await OneSignal.Slidedown.promptPush();
      } else {
        await OneSignal.Notifications.requestPermission();
      }
      await identifyUser();
    });
  }, [status, userId, userMunicipalityId, userRole]);

  return null;
}
