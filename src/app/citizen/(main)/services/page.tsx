import Link from "next/link";

export default async function CitizenServicesPage() {
  return (
    <div className="w-full px-3 md:px-0">
      <header className="gov-page-heading mb-6 border-b border-[var(--gov-border)] pb-4">
        <h1 className="text-lg font-bold text-[var(--gov-text)] md:text-xl">الخدمات المتاحة</h1>
        <p className="mt-1 text-sm text-[var(--gov-muted)]">اختر الخدمة، ثم أكمل النموذج والمرفقات من بوابة الطلب.</p>
      </header>
      <section className="gov-card mt-4 p-4 text-center md:p-6">
        <p className="mb-4 text-sm text-[var(--gov-muted)]">
          اضغط على الزر لفتح صفحة خدمات بلدية بصرى الشام، ومنها يمكنك اختيار الخدمة ثم تقديم الطلب.
        </p>
        <div className="flex flex-col items-center gap-3">
          <Link
            href="/citizen/services/bosra"
            className="gov-btn-primary inline-flex min-h-11 items-center justify-center rounded-xl px-5 py-2.5 text-sm font-bold no-underline md:text-base"
          >
            خدمات بلدية بصرى الشام
          </Link>
          <Link
            href="/citizen/services/gas"
            className="inline-flex min-h-11 items-center justify-center rounded-xl border border-[var(--gov-border)] bg-white px-5 py-2.5 text-sm font-bold text-[var(--gov-primary)] no-underline transition hover:bg-[#f7faf8] md:text-base"
          >
            خدمات الغاز
          </Link>
        </div>
      </section>
    </div>
  );
}
