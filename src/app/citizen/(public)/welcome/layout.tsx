/**
 * طبقة خلفية كاملة فوراً لتجنّب وميض خلفية الموقع (#ecf4ef) أو أي عنصر قبل تحميل الواجهة الترحيبية.
 */
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
