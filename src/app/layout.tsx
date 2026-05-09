import type { Metadata, Viewport } from "next";
import { Tajawal } from "next/font/google";
import { headers } from "next/headers";
import "./globals.css";
import { Providers } from "@/components/Providers";
import { ENTITY_NAME_AR } from "@/lib/entity";
import { cn } from "@/lib/cn";

const tajawal = Tajawal({
  subsets: ["arabic", "latin"],
  variable: "--font-tajawal",
  display: "swap",
  weight: ["400", "500", "700"],
});

export const metadata: Metadata = {
  title: `${ENTITY_NAME_AR} — البوابة الإلكترونية`,
  description:
    "بوابة مواطنين منفصلة (/) عن لوحة تحكم الموظفين والمديرين (/admin) — مسارات وواجهات وتسجيل دخول مختلفة لكل طرف",
  applicationName: "بلدية بصرى الشام",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "بلدية بصرى الشام",
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

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const welcomeShell = (await headers()).get("x-welcome-route") === "1";

  return (
    <html lang="ar" dir="rtl" className={cn("h-full", welcomeShell && "bg-[#0B2B26]")}>
      <body
        className={cn(
          "min-h-full antialiased [font-feature-settings:'tnum']",
          tajawal.className,
          welcomeShell ? "welcome-route-shell bg-[#0B2B26]" : "gov-page",
        )}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
