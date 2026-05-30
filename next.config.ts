import type { NextConfig } from "next";
import withPWAInit from "@ducanh2912/next-pwa";

/**
 * PWA + Next 16 + مجموعات مسارات قد تُسبب client reference manifest لـ "/".
 * PWA مطلوب لتثبيت تطبيق المواطن، لذلك يبقى مفعلاً في الإنتاج ما لم يُعطّل صراحةً.
 */
const pwaDisabled =
  process.env.NODE_ENV === "development" ||
  process.env.DISABLE_PWA === "1";

const withPWA = withPWAInit({
  dest: "public",
  disable: pwaDisabled,
  register: false,
  /** لا نُخزّن مرفقات المواطنين في الـ SW وقت البناء (تتغير بعد النشر وتسبب 404/نسخة قديمة). */
  publicExcludes: ["!uploads/**"],
  /** دمج قواعد التخزين الافتراضية مع قاعدة مرفقات لا تُخزَّن (قبل مسار «الصفحات» العام). */
  extendDefaultRuntimeCaching: true,
  workboxOptions: {
    runtimeCaching: [
      {
        urlPattern: ({ url }: { url: URL }) =>
          url.pathname.startsWith("/admin") ||
          url.pathname.startsWith("/staff") ||
          url.pathname.startsWith("/employee") ||
          url.pathname.startsWith("/gas-agent") ||
          url.pathname.startsWith("/api/"),
        handler: "NetworkOnly",
        method: "GET",
      },
      {
        urlPattern: ({ url }: { url: URL }) => url.pathname.startsWith("/uploads/"),
        handler: "NetworkOnly",
        method: "GET",
      },
    ],
  },
});

/** لعناوين مثل 192.168.x.x عند فتح الموقع من موبايل على نفس Wi‑Fi (قائمة مفصولة بفواصل، من .env: LOCAL_LAN_HOSTS) */
const localLanHosts =
  process.env.LOCAL_LAN_HOSTS?.split(/,\s*/).map((s) => s.trim()).filter(Boolean) ?? [];

const nextConfig: NextConfig = {
  /** + عناوين الشبكة المحلية لأن Next 16 يحجب /_next و HMR لأي Origin غير مُدرج */
  allowedDevOrigins: ["127.0.0.1", "[::1]", ...localLanHosts],
  serverExternalPackages: ["bcrypt", "@libsql/client", "@prisma/adapter-libsql"],
  experimental: {
    // رفع حجم body للـ Server Actions لأن نموذج الطلب يرفع مرفقات من الجوال.
    serverActions: {
      // عدة مرفقات قد تصل كلّها إلى ~٥ ميغابايت لكل ملف
      bodySizeLimit: "30mb",
    },
  },
  async headers() {
    return [
      {
        source: "/admin/:path*",
        headers: [
          { key: "Cache-Control", value: "no-store, no-cache, must-revalidate, proxy-revalidate" },
          { key: "Pragma", value: "no-cache" },
          { key: "Expires", value: "0" },
        ],
      },
      {
        source: "/staff/:path*",
        headers: [
          { key: "Cache-Control", value: "no-store, no-cache, must-revalidate, proxy-revalidate" },
          { key: "Pragma", value: "no-cache" },
          { key: "Expires", value: "0" },
        ],
      },
      {
        source: "/employee/:path*",
        headers: [
          { key: "Cache-Control", value: "no-store, no-cache, must-revalidate, proxy-revalidate" },
          { key: "Pragma", value: "no-cache" },
          { key: "Expires", value: "0" },
        ],
      },
      {
        source: "/gas-agent/:path*",
        headers: [
          { key: "Cache-Control", value: "no-store, no-cache, must-revalidate, proxy-revalidate" },
          { key: "Pragma", value: "no-cache" },
          { key: "Expires", value: "0" },
        ],
      },
    ];
  },
  async redirects() {
    return [
      /* لا تعيد توجيه /citizen إلى / — يكسر دخول المواطن (الجذر يعيد التوجيه إلى /citizen فيصير حلقة لا نهائية). */
      { source: "/employee", destination: "/staff", permanent: false },
      { source: "/employee/:path*", destination: "/staff/:path*", permanent: false },
      { source: "/my-requests", destination: "/requests", permanent: false },
      { source: "/my-requests/:id", destination: "/requests/:id", permanent: false },
      { source: "/new-request/:serviceId", destination: "/requests/new/:serviceId", permanent: false },
      { source: "/after-login", destination: "/", permanent: false },
    ];
  },
};

export default withPWA(nextConfig);
