import Link from "next/link";
import { GovStepIndicator } from "@/components/gov/GovStepIndicator";

export default async function CitizenServicesPage() {
  return (
    <div className="w-full min-w-0 max-w-full">
      <header className="gov-page-heading mb-3 border-b border-[var(--gov-border)] pb-3 md:mb-6 md:pb-4">
        <h1 className="text-base font-bold text-[var(--gov-text)] md:text-lg md:font-bold xl:text-xl">
          الخدمات المتاحة
        </h1>
        <p className="mt-1 text-xs leading-relaxed text-[var(--gov-muted)] sm:text-sm">
          اختر خدمة ثم أكمل البيانات والمرفقات.
        </p>
      </header>
      <GovStepIndicator currentStep={1} density="compact" />
      <section className="gov-card mt-3 p-4 text-center md:mt-5 md:p-6">
        <p className="mb-4 text-xs leading-relaxed text-[var(--gov-muted)] md:text-sm">
          اضغط على الزر للدخول إلى صفحة خدمات بلدية بصرى الشام، حيث تظهر كل الخدمات الحالية وأي خدمات تُضاف لاحقاً.
        </p>
        <Link
          href="/services/bosra"
          className="gov-btn-primary inline-flex min-h-11 items-center justify-center rounded-xl px-5 py-2.5 text-sm font-bold no-underline md:text-base"
        >
          خدمات بلدية بصرى الشام
        </Link>
      </section>
    </div>
  );
}
