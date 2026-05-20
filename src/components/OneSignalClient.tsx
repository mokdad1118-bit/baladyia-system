"use client";

import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { UserRole } from "@/generated/prisma/enums";

const DARAA_ONESIGNAL_APP_ID = "30f2deb1-debf-4b7c-80c0-0d11dd28f01d";
const DARAA_PORTAL_NAME = "بوابة محافظة درعا";

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

  useEffect(() => {
    const appId = process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID || DARAA_ONESIGNAL_APP_ID;
    if (!appId || typeof window === "undefined") return;

    window.OneSignalDeferred = window.OneSignalDeferred || [];
    window.OneSignalDeferred.push(async (OneSignal) => {
      if (window.__daraaOneSignalInitFailed) return;
      if (!window.__daraaOneSignalInitialized) {
        try {
          await OneSignal.init({
            appId,
            serviceWorkerPath: "OneSignalSDKWorker.js",
            welcomeNotification: {
              title: DARAA_PORTAL_NAME,
              message: "تم تفعيل إشعارات بوابة محافظة درعا.",
              url: "/citizen/notifications",
            },
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
      const tags = {
        governorate: "daraa",
        municipalityId: user.municipalityId?.trim() || "all",
        role,
      };
      const identifyUser = async () => {
        await OneSignal.login(user.id);
        await OneSignal.User.addTags(tags);
      };

      await identifyUser();
      if (!window.__daraaOneSignalSubscriptionListener) {
        OneSignal.User.PushSubscription.addEventListener("change", () => {
          void identifyUser();
        });
        window.__daraaOneSignalSubscriptionListener = true;
      }

      if (user.role !== UserRole.CITIZEN) return;
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
  }, [session?.user?.id, session?.user?.municipalityId, session?.user?.role, status]);

  return null;
}
