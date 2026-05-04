import type { NextConfig } from "next";
import withPWAInit from "@ducanh2912/next-pwa";

/**
 * PWA + Next 16 + مجموعات مسارات قد تُسبب client reference manifest لـ "/".
 * في `next build` لا يُضمن وجود RENDER — لذلك نُعطّل PWA في كل بناء إنتاج ما لم يُفعَّل صراحةً.
 */
const pwaDisabled =
  process.env.NODE_ENV === "development" ||
  process.env.DISABLE_PWA === "1" ||
  process.env.ENABLE_PWA !== "1";

const withPWA = withPWAInit({
  dest: "public",
  disable: pwaDisabled,
  /** لا نُخزّن مرفقات المواطنين في الـ SW وقت البناء (تتغير بعد النشر وتسبب 404/نسخة قديمة). */
  publicExcludes: ["!uploads/**"],
  /** دمج قواعد التخزين الافتراضية مع قاعدة مرفقات لا تُخزَّن (قبل مسار «الصفحات» العام). */
  extendDefaultRuntimeCaching: true,
  workboxOptions: {
    runtimeCaching: [
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
