import type { Metadata, Viewport } from "next";
import { Tajawal } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/Providers";
import { ENTITY_NAME_AR } from "@/lib/entity";

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
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#124a38",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl" className={`h-full ${tajawal.variable}`}>
      <body
        className={`gov-page min-h-full ${tajawal.className} antialiased [font-feature-settings:'tnum']`}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
