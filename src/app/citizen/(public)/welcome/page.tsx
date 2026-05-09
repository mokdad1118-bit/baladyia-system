import type { Metadata } from "next";
import { CitizenWelcomeScreen } from "@/components/citizen/CitizenWelcomeScreen";

/** أيقونة مسطّحة بلون الترحيب لتقليل ظهور شعار آخر على شاشة فتح التطبيق (iOS / لقطات الحالة). */
export const metadata: Metadata = {
  icons: {
    apple: [{ url: "/brand/welcome-pwa-icon-192.png", sizes: "192x192", type: "image/png" }],
  },
};

export default function CitizenWelcomePage() {
  return <CitizenWelcomeScreen />;
}
