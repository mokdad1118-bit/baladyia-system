"use client";

import { useActionState } from "react";
import { SocialServiceCategory } from "@/generated/prisma/enums";
import type { SubmitSocialServiceCaseState } from "@/actions/social-service-case";
import { socialServiceCategoryLabelAr } from "@/lib/social-service-labels";
import { AsyncWaitOverlay } from "@/components/ui/AsyncWaitOverlay";

export function SocialServiceCaseForm({
  category,
  action,
  successReturnPath,
  prefill,
}: {
  category: SocialServiceCategory;
  action: (prev: SubmitSocialServiceCaseState, formData: FormData) => Promise<SubmitSocialServiceCaseState>;
  successReturnPath: "/citizen/services/returnees" | "/services/returnees";
  prefill?: { name?: string | null; phone?: string | null; nationalId?: string | null; email?: string | null };
}) {
  const [state, formAction, pending] = useActionState(action, undefined);
  const isFamily = category === SocialServiceCategory.FAMILY_CENSUS;
  const attachmentLabel =
    category === SocialServiceCategory.DIVORCED
      ? "بيان طلاق"
      : category === SocialServiceCategory.WIDOWS
        ? "بيان وفاة"
        : category === SocialServiceCategory.ORPHANS
          ? "بيان وفاة"
          : category === SocialServiceCategory.DISABILITIES
            ? "بطاقة إعاقة"
            : category === SocialServiceCategory.CHRONIC_DISEASES
              ? "تقرير طبي"
              : "صور دفتر العائلة";
  const fileHint = isFamily ? "(حتى 10 صور)" : "(صورة واحدة)";

  return (
    <>
      <AsyncWaitOverlay active={pending} variant="gov" />
      <form action={formAction} className="space-y-4" encType="multipart/form-data">
        <input type="hidden" name="_successReturnPath" value={successReturnPath} />
        <input type="hidden" name="category" value={category} />
        {state?.error ? <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm">{state.error}</p> : null}

        {isFamily ? (
          <>
            <div>
              <label className="mb-1.5 block text-sm font-medium">الاسم الثلاثي للزوج</label>
              <input name="husbandFullName" required minLength={3} className="gov-input w-full px-3 py-2.5 text-sm" />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium">تاريخ ميلاد الزوج</label>
              <input name="husbandBirthDate" type="date" required className="gov-input w-full px-3 py-2.5 text-sm" dir="ltr" />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium">الرقم الوطني للزوج</label>
              <input name="husbandNationalId" required pattern="[0-9]{10,11}" minLength={10} maxLength={11} inputMode="numeric" dir="ltr" className="gov-input w-full px-3 py-2.5 text-sm" />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium">الاسم الثلاثي للزوجة</label>
              <input name="wifeFullName" required minLength={3} className="gov-input w-full px-3 py-2.5 text-sm" />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium">تاريخ ميلاد الزوجة</label>
              <input name="wifeBirthDate" type="date" required className="gov-input w-full px-3 py-2.5 text-sm" dir="ltr" />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium">الرقم الوطني للزوجة</label>
              <input name="wifeNationalId" required pattern="[0-9]{10,11}" minLength={10} maxLength={11} inputMode="numeric" dir="ltr" className="gov-input w-full px-3 py-2.5 text-sm" />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium">رقم دفتر العائلة</label>
              <input name="familyBookNumber" required inputMode="numeric" dir="ltr" className="gov-input w-full px-3 py-2.5 text-sm" />
            </div>
          </>
        ) : (
          <>
            <div>
              <label className="mb-1.5 block text-sm font-medium">الاسم الثلاثي</label>
              <input name="fullName" required minLength={3} defaultValue={prefill?.name ?? ""} className="gov-input w-full px-3 py-2.5 text-sm" />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium">تاريخ الميلاد</label>
              <input name="birthDate" type="date" required className="gov-input w-full px-3 py-2.5 text-sm" dir="ltr" />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium">الرقم الوطني</label>
              <input name="nationalId" required pattern="[0-9]{10,11}" minLength={10} maxLength={11} defaultValue={prefill?.nationalId ?? ""} inputMode="numeric" dir="ltr" className="gov-input w-full px-3 py-2.5 text-sm" />
            </div>
          </>
        )}

        <div>
          <label className="mb-1.5 block text-sm font-medium">رقم الهاتف</label>
          <input name="phone" required defaultValue={prefill?.phone ?? ""} inputMode="numeric" dir="ltr" className="gov-input w-full px-3 py-2.5 text-sm" />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium">البريد الإلكتروني</label>
          <input name="email" type="email" required defaultValue={prefill?.email ?? ""} dir="ltr" className="gov-input w-full px-3 py-2.5 text-sm" />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium">
            {attachmentLabel} <span className="font-normal text-[var(--gov-muted)]">{fileHint}</span>
          </label>
          <input name="attachments" type="file" accept="image/jpeg,image/png,image/webp,image/jpg" required multiple={isFamily} className="gov-input w-full px-3 py-2.5 text-sm file:me-3 file:rounded-md file:border-0 file:bg-[var(--gov-primary)]/10 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-[var(--gov-primary)]" />
        </div>
        <button type="submit" disabled={pending} className="gov-btn-primary w-full px-4 py-3 text-sm font-semibold">
          {pending ? "جاري الإرسال..." : "إرسال الطلب"}
        </button>
      </form>
    </>
  );
}
