"use client";

import { useActionState } from "react";
import type { ReactNode } from "react";
import { SocialServiceCategory } from "@/generated/prisma/enums";
import {
  submitInPersonReturneeRegistration,
  submitInPersonSocialServiceCase,
} from "@/actions/admin-in-person-requests";
import { socialServiceCategoryLabelAr } from "@/lib/social-service-labels";
import { AsyncWaitOverlay } from "@/components/ui/AsyncWaitOverlay";

type FormState = { error?: string } | undefined;

function Field({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-[var(--gov-text)]">{label}</label>
      {children}
    </div>
  );
}

export function AdminInPersonReturneeRegistrationForm({
  municipalityId,
  municipalityName,
}: {
  municipalityId: string;
  municipalityName: string;
}) {
  const [state, action, pending] = useActionState<FormState, FormData>(
    submitInPersonReturneeRegistration,
    undefined,
  );

  return (
    <>
      <AsyncWaitOverlay active={pending} variant="gov" />
      <form action={action} className="gov-card space-y-5 p-4 md:p-6" encType="multipart/form-data">
        <input type="hidden" name="municipalityId" value={municipalityId} />
        <header className="border-b border-[var(--gov-border)] pb-4">
          <h2 className="text-base font-bold text-[var(--gov-text)]">إنشاء طلب تسجيل عائدين حضوري</h2>
          <p className="mt-1 text-sm text-[var(--gov-muted)]">{municipalityName}</p>
        </header>

        {state?.error ? (
          <p className="rounded-sm border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800">{state.error}</p>
        ) : null}

        <section className="grid gap-3 md:grid-cols-2">
          <Field label="الاسم الثلاثي *">
            <input name="fullName" required minLength={3} className="gov-input w-full px-3 py-2.5 text-sm" />
          </Field>
          <Field label="تاريخ الميلاد *">
            <input name="birthDate" type="date" required dir="ltr" className="gov-input w-full px-3 py-2.5 text-sm" />
          </Field>
          <Field label="الرقم الوطني *">
            <input
              name="nationalId"
              required
              pattern="[0-9]{10,11}"
              minLength={10}
              maxLength={11}
              inputMode="numeric"
              dir="ltr"
              className="gov-input w-full px-3 py-2.5 text-sm"
            />
          </Field>
          <Field label="رقم الواتساب *">
            <input name="phone" required inputMode="numeric" dir="ltr" className="gov-input w-full px-3 py-2.5 text-sm" />
          </Field>
          <Field label="البريد الإلكتروني *">
            <input name="email" type="email" required dir="ltr" className="gov-input w-full px-3 py-2.5 text-sm" />
          </Field>
          <Field label="صورة بيان العودة *">
            <input
              name="returnStatement"
              type="file"
              accept="image/jpeg,image/png,image/webp,image/jpg"
              required
              className="gov-file-input block w-full cursor-pointer text-sm"
            />
          </Field>
        </section>

        <div className="border-t border-[var(--gov-border)] pt-4">
          <button type="submit" disabled={pending} className="gov-btn-primary px-5 py-2.5 text-sm font-semibold disabled:opacity-60">
            {pending ? "جاري الحفظ..." : "حفظ الطلب الحضوري"}
          </button>
        </div>
      </form>
    </>
  );
}

export function AdminInPersonSocialServiceCaseForm({
  municipalityId,
  municipalityName,
  category,
}: {
  municipalityId: string;
  municipalityName: string;
  category: SocialServiceCategory;
}) {
  const [state, action, pending] = useActionState<FormState, FormData>(
    submitInPersonSocialServiceCase,
    undefined,
  );
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

  return (
    <>
      <AsyncWaitOverlay active={pending} variant="gov" />
      <form action={action} className="gov-card space-y-5 p-4 md:p-6" encType="multipart/form-data">
        <input type="hidden" name="municipalityId" value={municipalityId} />
        <input type="hidden" name="category" value={category} />
        <header className="border-b border-[var(--gov-border)] pb-4">
          <h2 className="text-base font-bold text-[var(--gov-text)]">إنشاء طلب حضوري</h2>
          <p className="mt-1 text-sm text-[var(--gov-muted)]">
            {socialServiceCategoryLabelAr[category]} - {municipalityName}
          </p>
        </header>

        {state?.error ? (
          <p className="rounded-sm border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800">{state.error}</p>
        ) : null}

        <section className="grid gap-3 md:grid-cols-2">
          {isFamily ? (
            <>
              <Field label="الاسم الثلاثي للزوج *">
                <input name="husbandFullName" required minLength={3} className="gov-input w-full px-3 py-2.5 text-sm" />
              </Field>
              <Field label="تاريخ ميلاد الزوج *">
                <input name="husbandBirthDate" type="date" required dir="ltr" className="gov-input w-full px-3 py-2.5 text-sm" />
              </Field>
              <Field label="الرقم الوطني للزوج *">
                <input name="husbandNationalId" required pattern="[0-9]{10,11}" minLength={10} maxLength={11} inputMode="numeric" dir="ltr" className="gov-input w-full px-3 py-2.5 text-sm" />
              </Field>
              <Field label="الاسم الثلاثي للزوجة *">
                <input name="wifeFullName" required minLength={3} className="gov-input w-full px-3 py-2.5 text-sm" />
              </Field>
              <Field label="تاريخ ميلاد الزوجة *">
                <input name="wifeBirthDate" type="date" required dir="ltr" className="gov-input w-full px-3 py-2.5 text-sm" />
              </Field>
              <Field label="الرقم الوطني للزوجة *">
                <input name="wifeNationalId" required pattern="[0-9]{10,11}" minLength={10} maxLength={11} inputMode="numeric" dir="ltr" className="gov-input w-full px-3 py-2.5 text-sm" />
              </Field>
              <Field label="رقم دفتر العائلة *">
                <input name="familyBookNumber" required inputMode="numeric" dir="ltr" className="gov-input w-full px-3 py-2.5 text-sm" />
              </Field>
            </>
          ) : (
            <>
              <Field label="الاسم الثلاثي *">
                <input name="fullName" required minLength={3} className="gov-input w-full px-3 py-2.5 text-sm" />
              </Field>
              <Field label="تاريخ الميلاد *">
                <input name="birthDate" type="date" required dir="ltr" className="gov-input w-full px-3 py-2.5 text-sm" />
              </Field>
              <Field label="الرقم الوطني *">
                <input name="nationalId" required pattern="[0-9]{10,11}" minLength={10} maxLength={11} inputMode="numeric" dir="ltr" className="gov-input w-full px-3 py-2.5 text-sm" />
              </Field>
            </>
          )}
          <Field label="رقم الواتساب *">
            <input name="phone" required inputMode="numeric" dir="ltr" className="gov-input w-full px-3 py-2.5 text-sm" />
          </Field>
          <Field label="البريد الإلكتروني *">
            <input name="email" type="email" required dir="ltr" className="gov-input w-full px-3 py-2.5 text-sm" />
          </Field>
          <Field label={`${attachmentLabel} *`}>
            <input
              name="attachments"
              type="file"
              accept="image/jpeg,image/png,image/webp,image/jpg"
              required
              multiple={isFamily}
              className="gov-file-input block w-full cursor-pointer text-sm"
            />
            <p className="mt-1.5 text-xs text-[var(--gov-muted)]">
              {isFamily ? "يمكن رفع حتى 10 صور." : "يرجى رفع صورة واحدة فقط."}
            </p>
          </Field>
        </section>

        <div className="border-t border-[var(--gov-border)] pt-4">
          <button type="submit" disabled={pending} className="gov-btn-primary px-5 py-2.5 text-sm font-semibold disabled:opacity-60">
            {pending ? "جاري الحفظ..." : "حفظ الطلب الحضوري"}
          </button>
        </div>
      </form>
    </>
  );
}
