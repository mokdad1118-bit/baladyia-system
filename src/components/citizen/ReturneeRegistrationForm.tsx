"use client";

import { useActionState } from "react";
import { AsyncWaitOverlay } from "@/components/ui/AsyncWaitOverlay";
import type { SubmitReturneeRegistrationState } from "@/actions/returnee-registration";

export function ReturneeRegistrationForm({
  action,
  prefill,
  successReturnPath,
}: {
  action: (
    prev: SubmitReturneeRegistrationState,
    formData: FormData,
  ) => Promise<SubmitReturneeRegistrationState>;
  /** مسار الصفحة بعد نجاح الإرسال (يُمرَّر للخادم للتحقق منه) */
  successReturnPath: "/citizen/services/returnees" | "/services/returnees";
  prefill?: {
    name?: string | null;
    phone?: string | null;
    nationalId?: string | null;
    email?: string | null;
  };
}) {
  const [state, formAction, pending] = useActionState(action, undefined);

  return (
    <>
      <AsyncWaitOverlay active={pending} variant="gov" />
      <form action={formAction} className="space-y-4" encType="multipart/form-data">
        <input type="hidden" name="_successReturnPath" value={successReturnPath} />
        {state?.error ? (
          <p className="rounded-xl border border-[var(--gov-flag-red)]/40 bg-[var(--gov-flag-red)]/5 px-3 py-2 text-sm">
            {state.error}
          </p>
        ) : null}

        <div>
          <label className="mb-1.5 block text-sm font-medium">الاسم الثلاثي</label>
          <input
            name="fullName"
            required
            minLength={3}
            autoComplete="name"
            defaultValue={prefill?.name ?? ""}
            className="gov-input w-full px-3 py-2.5 text-sm"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium">تاريخ الميلاد</label>
          <input
            name="birthDate"
            type="date"
            required
            className="gov-input w-full px-3 py-2.5 text-sm"
            dir="ltr"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium">الرقم الوطني</label>
          <input
            name="nationalId"
            required
            inputMode="numeric"
            dir="ltr"
            minLength={10}
            maxLength={11}
            pattern="[0-9]{10,11}"
            defaultValue={prefill?.nationalId ?? ""}
            className="gov-input w-full px-3 py-2.5 text-sm"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium">رقم الهاتف</label>
          <input
            name="phone"
            required
            inputMode="numeric"
            autoComplete="tel"
            dir="ltr"
            defaultValue={prefill?.phone ?? ""}
            className="gov-input w-full px-3 py-2.5 text-sm"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium">البريد الإلكتروني</label>
          <input
            name="email"
            type="email"
            required
            autoComplete="email"
            dir="ltr"
            defaultValue={prefill?.email ?? ""}
            className="gov-input w-full px-3 py-2.5 text-sm"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium">
            صورة بيان العودة{" "}
            <span className="font-normal text-[var(--gov-muted)]">(صورة فقط — JPG أو PNG أو WebP)</span>
          </label>
          <input
            name="returnStatement"
            type="file"
            accept="image/jpeg,image/png,image/webp,image/jpg"
            required
            className="gov-input w-full px-3 py-2.5 text-sm file:me-3 file:rounded-md file:border-0 file:bg-[var(--gov-primary)]/10 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-[var(--gov-primary)]"
          />
        </div>

        <button type="submit" disabled={pending} className="gov-btn-primary w-full px-4 py-3 text-sm font-semibold">
          {pending ? "جاري الإرسال..." : "إرسال طلب تسجيل العائدين"}
        </button>
      </form>
    </>
  );
}
