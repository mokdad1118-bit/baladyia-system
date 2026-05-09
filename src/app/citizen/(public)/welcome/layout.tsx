import type { Viewport } from "next";

/**
 * طبقة خلفية كاملة فوراً + لون شريط الحالة يطابق الترحيب (يتلاشى ظهور الشعار الافتراضي للتطبيق).
 */
export const viewport: Viewport = {
  themeColor: "#0B2B26",
};

export default function CitizenWelcomeLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="fixed inset-0 z-[100] min-h-dvh overflow-y-auto bg-[#0B2B26]" lang="ar" dir="rtl">
      {children}
    </div>
  );
}
