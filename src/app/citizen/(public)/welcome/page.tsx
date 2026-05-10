import type { Metadata } from "next";
import { CitizenWelcomeScreen } from "@/components/citizen/CitizenWelcomeScreen";
import { APP_NAME_AR } from "@/lib/entity";

/** أيقونة مسطّحة بلون الترحيب لتقليل ظهور شعار آخر على شاشة فتح التطبيق (iOS / لقطات الحالة). */
export const metadata: Metadata = {
  title: `الترحيب — ${APP_NAME_AR}`,
  icons: {
    apple: [{ url: "/brand/welcome-pwa-icon-192.png", sizes: "192x192", type: "image/png" }],
  },
};

export default function CitizenWelcomePage() {
  return <CitizenWelcomeScreen />;
}
