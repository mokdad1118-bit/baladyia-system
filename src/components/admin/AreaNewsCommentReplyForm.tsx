"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { replyToAreaNewsComment, type AreaNewsActionState } from "@/actions/admin-area-news";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="gov-btn-primary shrink-0 px-3 py-2 text-xs font-semibold disabled:opacity-60">
      {pending ? "جاري الإرسال..." : "رد الإدارة"}
    </button>
  );
}

export function AreaNewsCommentReplyForm({ commentId }: { commentId: string }) {
  const [state, action] = useActionState<AreaNewsActionState, FormData>(replyToAreaNewsComment, undefined);

  return (
    <form action={action} className="mt-3 flex items-start gap-2">
      <input type="hidden" name="commentId" value={commentId} />
      <textarea
        name="body"
        required
        minLength={2}
        maxLength={1000}
        rows={1}
        placeholder="اكتب رد الإدارة على تعليق المواطن..."
        className="gov-input min-h-10 flex-1 resize-none px-3 py-2 text-sm"
      />
      <SubmitButton />
      {state && "error" in state ? <p className="sr-only" role="alert">{state.error}</p> : null}
    </form>
  );
}
