import { BRAND_ASSETS } from "@/lib/entity";

export function CitizenLoadingIdentity() {
  return (
    <div className="flex min-h-[60dvh] items-center justify-center px-4" role="status" aria-live="polite" aria-label="جاري التحميل">
      <div className="text-center">
        <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full border border-[var(--gov-border)] bg-white shadow-lg">
          {/* eslint-disable-next-line @next/next/no-img-element -- شعار ثابت من public ليظهر فور تحميل صفحة المواطن */}
          <img src={BRAND_ASSETS.stateEmblemPng} alt="بوابة محافظة درعا" className="h-[4.5rem] w-[4.5rem] rounded-full object-contain" />
        </div>
        <p className="mt-4 text-sm font-bold text-[var(--gov-text)]">بوابة محافظة درعا</p>
        <p className="mt-1 text-xs text-[var(--gov-muted)]">جاري التحميل...</p>
      </div>
    </div>
  );
}
