import type { Metadata } from "next";
import { CitizenWelcomeScreen } from "@/components/citizen/CitizenWelcomeScreen";
import { APP_NAME_AR } from "@/lib/entity";

/** أيقونة مسطّحة بلون الترحيب لتقليل ظهور شعار آخر على شاشة فتح التطبيق (iOS / لقطات الحالة). */
export const metadata: Metadata = {
  title: `الترحيب — ${APP_NAME_AR}`,
  icons: {
    apple: [{ url: "/brand/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
};

export default function CitizenWelcomePage() {
  return <CitizenWelcomeScreen />;
}
