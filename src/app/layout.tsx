import type { Metadata, Viewport } from "next";
import Script from "next/script";
import { Tajawal } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/Providers";
import { APP_NAME_AR, OFFICIAL_SCOPE_AR, SUPERVISING_AUTHORITY_AR } from "@/lib/entity";

const tajawal = Tajawal({
  subsets: ["arabic", "latin"],
  variable: "--font-tajawal",
  display: "swap",
  weight: ["400", "500", "700"],
});

export const metadata: Metadata = {
  title: APP_NAME_AR,
  description:
    `${OFFICIAL_SCOPE_AR} — ${SUPERVISING_AUTHORITY_AR}. خدمات المواطنين ولوحات موظفي البلديات ضمن منصة واحدة.`,
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
      { url: "/brand/icon-256.png", sizes: "256x256", type: "image/png" },
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
        <Script id="admin-pwa-cache-reset" strategy="beforeInteractive">
          {`
            (function () {
              if (!location.pathname.startsWith('/admin')) return;
              if (!('serviceWorker' in navigator)) return;
              var key = 'admin_pwa_cache_reset_inline_v1';
              if (sessionStorage.getItem(key) === '1') return;
              Promise.all([
                navigator.serviceWorker.getRegistrations().then(function (registrations) {
                  return Promise.all(registrations.map(function (registration) {
                    var script =
                      (registration.active && registration.active.scriptURL) ||
                      (registration.waiting && registration.waiting.scriptURL) ||
                      (registration.installing && registration.installing.scriptURL) ||
                      '';
                    var coversAdmin = (location.origin + '/admin/').indexOf(registration.scope) === 0;
                    if (coversAdmin && /\\/sw\\.js(?:$|\\?)/.test(script)) return registration.unregister();
                  }));
                }),
                'caches' in window
                  ? caches.keys().then(function (names) {
                      return Promise.all(names.filter(function (name) {
                        return /^(apis|pages|pages-rsc|pages-rsc-prefetch|next-data|next-static-js-assets|static-js-assets|start-url)$/.test(name) ||
                          name.indexOf('workbox') !== -1 ||
                          name.indexOf('next-pwa') !== -1;
                      }).map(function (name) { return caches.delete(name); }));
                    })
                  : Promise.resolve()
              ]).then(function () {
                sessionStorage.setItem(key, '1');
                location.reload();
              }).catch(function () {});
            })();
          `}
        </Script>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
