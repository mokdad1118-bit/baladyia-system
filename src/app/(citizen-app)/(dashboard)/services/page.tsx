import Link from "next/link";
import { StateEmblem } from "@/components/gov/StateEmblem";
import { APP_NAME_AR, ENTITY_NAME_AR } from "@/lib/entity";

export default async function CitizenServicesPage() {
  return (
    <div className="w-full min-w-0 max-w-full">
      <header className="gov-page-heading mb-3 border-b border-[var(--gov-border)] pb-3 md:mb-6 md:pb-4">
        <div className="mb-3 flex items-center justify-center gap-3">
          <StateEmblem height={52} />
          <p className="text-sm font-bold text-[var(--gov-text)] md:text-base">{ENTITY_NAME_AR}</p>
        </div>
        <h1 className="text-base font-bold text-[var(--gov-text)] md:text-lg md:font-bold xl:text-xl">
          الخدمات المتاحة
        </h1>
        <p className="mt-1 text-xs leading-relaxed text-[var(--gov-muted)] sm:text-sm">
          اختر خدمة ثم أكمل البيانات والمرفقات.
        </p>
      </header>
      <section className="gov-card mt-3 p-4 text-center md:mt-5 md:p-6">
        <p className="mb-4 text-xs leading-relaxed text-[var(--gov-muted)] md:text-sm">
          يرجى اخيتار الخدمة المطلوبة ثم تقديم الطلب
        </p>
        <div className="space-y-3">
          <div className="flex justify-center">
            <Link
              href="/services/bosra"
              className="gov-btn-primary inline-flex min-h-11 min-w-[16rem] items-center justify-center rounded-xl px-5 py-2.5 text-sm font-bold no-underline md:text-base"
            >
              خدمات {APP_NAME_AR}
            </Link>
          </div>
          <div className="flex justify-center">
            <Link
              href="/services/gas"
              className="gov-btn-primary inline-flex min-h-11 min-w-[16rem] items-center justify-center rounded-xl px-5 py-2.5 text-sm font-bold no-underline md:text-base"
            >
              خدمات الغاز
            </Link>
          </div>
          <div className="flex justify-center">
            <Link
              href="/services/returnees"
              className="gov-btn-primary inline-flex min-h-11 min-w-[16rem] items-center justify-center rounded-xl px-5 py-2.5 text-sm font-bold no-underline md:text-base"
            >
              الخدمات الاجتماعية
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
