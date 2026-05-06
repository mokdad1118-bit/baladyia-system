import Link from "next/link";
import { StateEmblem } from "@/components/gov/StateEmblem";

export default async function CitizenServicesPage() {
  return (
    <div className="w-full px-3 md:px-0">
      <header className="gov-page-heading mb-6 border-b border-[var(--gov-border)] pb-4">
        <div className="mb-3 flex items-center justify-center gap-3">
          <StateEmblem height={52} />
          <p className="text-sm font-bold text-[var(--gov-text)] md:text-base">مجلس مدينة بصرى الشام</p>
        </div>
        <h1 className="text-lg font-bold text-[var(--gov-text)] md:text-xl">الخدمات المتاحة</h1>
        <p className="mt-1 text-sm text-[var(--gov-muted)]">اختر الخدمة، ثم أكمل النموذج والمرفقات من بوابة الطلب.</p>
      </header>
      <section className="gov-card mt-4 p-4 text-center md:p-6">
        <p className="mb-4 text-sm text-[var(--gov-muted)]">
          يرجى اخيتار الخدمة المطلوبة ثم تقديم الطلب
        </p>
        <div className="space-y-3">
          <div className="flex justify-center">
            <Link
              href="/citizen/services/bosra"
              className="gov-btn-primary inline-flex min-h-11 min-w-[16rem] items-center justify-center rounded-xl px-5 py-2.5 text-sm font-bold no-underline md:text-base"
            >
              خدمات بلدية بصرى الشام
            </Link>
          </div>
          <div className="flex justify-center">
            <Link
              href="/citizen/services/gas"
              className="gov-btn-primary inline-flex min-h-11 min-w-[16rem] items-center justify-center rounded-xl px-5 py-2.5 text-sm font-bold no-underline md:text-base"
            >
              خدمات الغاز
            </Link>
          </div>
          <div className="flex justify-center">
            <Link
              href="/citizen/services/returnees"
              className="gov-btn-primary inline-flex min-h-11 min-w-[16rem] items-center justify-center rounded-xl px-5 py-2.5 text-sm font-bold no-underline md:text-base"
            >
              تسجيل العائدين
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
