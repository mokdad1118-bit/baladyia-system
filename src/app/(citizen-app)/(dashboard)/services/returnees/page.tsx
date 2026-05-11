import Link from "next/link";
export default async function CitizenReturneesDashboardPage() {
  return (
    <div className="gov-panel w-full min-w-0 max-w-full px-0">
      <header className="gov-page-heading mb-6 border-b border-[var(--gov-border)] pb-4">
        <h1 className="text-base font-bold text-[var(--gov-text)] md:text-xl">الخدمات الاجتماعية</h1>
        <p className="mt-1 text-xs text-[var(--gov-muted)] md:text-sm">
          اختر القسم المطلوب ثم أدخل البيانات والمرفقات.
        </p>
      </header>
      <div className="gov-card p-4 md:p-6">
        <div className="grid gap-3 md:grid-cols-2">
          <Link href="/services/returnees/returnees" className="gov-btn-primary inline-flex min-h-11 items-center justify-center px-4 text-sm font-bold no-underline">تسجيل العائدين</Link>
          <Link href="/services/returnees/divorced" className="gov-btn-primary inline-flex min-h-11 items-center justify-center px-4 text-sm font-bold no-underline">المطلقات</Link>
          <Link href="/services/returnees/widows" className="gov-btn-primary inline-flex min-h-11 items-center justify-center px-4 text-sm font-bold no-underline">الأرامل</Link>
          <Link href="/services/returnees/orphans" className="gov-btn-primary inline-flex min-h-11 items-center justify-center px-4 text-sm font-bold no-underline">الأيتام</Link>
          <Link href="/services/returnees/disabilities" className="gov-btn-primary inline-flex min-h-11 items-center justify-center px-4 text-sm font-bold no-underline">الإعاقات</Link>
          <Link href="/services/returnees/chronic-diseases" className="gov-btn-primary inline-flex min-h-11 items-center justify-center px-4 text-sm font-bold no-underline">الأمراض المزمنة</Link>
          <Link href="/services/returnees/family-census" className="gov-btn-primary inline-flex min-h-11 items-center justify-center px-4 text-sm font-bold no-underline md:col-span-2">الإحصاء العام للعوائل</Link>
        </div>
      </div>
    </div>
  );
}
