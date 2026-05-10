import type { Metadata, Viewport } from "next";
import { Tajawal } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/Providers";
import { APP_NAME_AR } from "@/lib/entity";

const tajawal = Tajawal({
  subsets: ["arabic", "latin"],
  variable: "--font-tajawal",
  display: "swap",
  weight: ["400", "500", "700"],
});

export const metadata: Metadata = {
  title: `${APP_NAME_AR} — البوابة الإلكترونية`,
  description:
    `بوابة ${APP_NAME_AR} للمواطنين — مسارات منفصلة عن لوحة الموظفين والمديرين.`,
  applicationName: APP_NAME_AR,
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: APP_NAME_AR,
  },
  formatDetection: { telephone: false },
  icons: {
    icon: [
      { url: "/brand/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/brand/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/brand/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#006c35",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl" className="h-full">
      <body className={`min-h-full antialiased [font-feature-settings:'tnum'] ${tajawal.className} gov-page`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
