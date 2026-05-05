"use client";

import { useActionState } from "react";
import { AsyncWaitOverlay } from "@/components/ui/AsyncWaitOverlay";
import type { SubmitGasRequestState } from "@/actions/gas-request";

export function GasRequestForm({
  action,
  prefill,
}: {
  action: (
    prev: SubmitGasRequestState,
    formData: FormData,
  ) => Promise<SubmitGasRequestState>;
  prefill?: {
    name?: string | null;
    phone?: string | null;
    nationalId?: string | null;
  };
}) {
  const [state, formAction, pending] = useActionState(action, undefined);

  return (
    <>
      <AsyncWaitOverlay active={pending} variant="gov" />
      <form action={formAction} className="space-y-4">
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

        <button type="submit" disabled={pending} className="gov-btn-primary w-full px-4 py-3 text-sm font-semibold">
          {pending ? "جاري الإرسال..." : "إرسال طلب خدمات الغاز"}
        </button>
      </form>
    </>
  );
}
