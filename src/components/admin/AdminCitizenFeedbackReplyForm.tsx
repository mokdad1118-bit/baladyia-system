"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { replyToCitizenFeedback } from "@/actions/admin-citizen-feedback";

export function AdminCitizenFeedbackReplyForm({
  feedbackId,
  existingReply,
}: {
  feedbackId: string;
  existingReply: string | null;
}) {
  const initialReply = existingReply?.trim() ?? "";
  const router = useRouter();
  const [state, formAction, pending] = useActionState(replyToCitizenFeedback, undefined);

  useEffect(() => {
    if (state && "ok" in state) {
      router.refresh();
    }
  }, [state, router]);

  return (
    <form action={formAction} className="min-w-[14rem] space-y-2">
      <input type="hidden" name="feedbackId" value={feedbackId} />
      <label className="block text-xs font-medium text-[var(--gov-muted)]">رد الإدارة للمواطن</label>
      <textarea
        name="reply"
        required
        minLength={5}
        maxLength={2000}
        rows={4}
        defaultValue={initialReply}
        className="gov-input w-full resize-y px-2 py-2 text-xs"
        placeholder="اكتب الرد… سيظهر للمواطن في الشكاوي والإشعارات."
      />
      {state && "error" in state ? (
        <p className="text-xs text-[var(--gov-flag-red)]">{state.error}</p>
      ) : null}
      {state && "ok" in state ? (
        <p className="text-xs font-medium text-emerald-700">تم حفظ الرد وإشعار المواطن.</p>
      ) : null}
      <button
        type="submit"
        disabled={pending}
        className="gov-btn-primary w-full px-3 py-2 text-xs font-semibold disabled:opacity-60"
      >
        {pending ? "جاري الإرسال…" : initialReply ? "تحديث الرد" : "إرسال الرد"}
      </button>
    </form>
  );
}
