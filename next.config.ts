import type { NextConfig } from "next";
import withPWAInit from "@ducanh2912/next-pwa";

const withPWA = withPWAInit({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
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
