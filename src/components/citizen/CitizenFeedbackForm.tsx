"use client";

import { useActionState } from "react";
import type { SubmitCitizenFeedbackState } from "@/actions/citizen-feedback";

export function CitizenFeedbackForm({
  action,
}: {
  action: (
    prev: SubmitCitizenFeedbackState,
    formData: FormData,
  ) => Promise<SubmitCitizenFeedbackState>;
}) {
  const [state, formAction, pending] = useActionState(action, undefined);

  return (
    <form action={formAction} className="space-y-4">
      <div className="rounded-xl border border-[var(--gov-border)] bg-white p-4">
        <label htmlFor="feedback-message" className="mb-2 block text-sm font-semibold text-[var(--gov-text)]">
          نص الشكوى أو المقترح
        </label>
        <textarea
          id="feedback-message"
          name="message"
          required
          minLength={10}
          maxLength={2000}
          rows={8}
          className="gov-input w-full resize-y px-3 py-2.5 text-sm"
          placeholder="اكتب هنا ملاحظتك بخصوص التطبيق أو مقترحك للتحسين..."
        />
      </div>

      {state && "error" in state ? (
        <p className="rounded-xl border border-[var(--gov-flag-red)]/40 bg-[var(--gov-flag-red)]/5 px-3 py-2 text-sm">
          {state.error}
        </p>
      ) : null}

      {state && "ok" in state ? (
        <p className="rounded-xl border border-[var(--gov-primary)]/30 bg-[var(--gov-primary)]/8 px-3 py-2 text-sm text-[var(--gov-primary)]">
          {state.message}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="gov-btn-primary inline-flex min-h-11 items-center justify-center px-5 py-2.5 text-sm font-semibold disabled:opacity-60"
      >
        {pending ? "جاري الإرسال..." : "إرسال"}
      </button>
    </form>
  );
}
