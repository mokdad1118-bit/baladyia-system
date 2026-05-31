"use client";

import { useActionState } from "react";
import { createAreaNewsPost, type AreaNewsActionState } from "@/actions/admin-area-news";

export function AreaNewsPostForm({
  municipalities,
  canSelectMunicipality,
}: {
  municipalities: { id: string; name: string }[];
  canSelectMunicipality: boolean;
}) {
  const [state, action, pending] = useActionState<AreaNewsActionState, FormData>(createAreaNewsPost, undefined);

  return (
    <form action={action} className="gov-card mb-6 space-y-4 p-4">
      <h2 className="text-base font-bold text-[var(--gov-text)]">منشور جديد</h2>
      {canSelectMunicipality ? (
        <div>
          <label className="mb-1.5 block text-sm font-medium text-[var(--gov-text)]">النطاق</label>
          <select name="municipalityId" className="gov-input w-full px-3 py-2.5 text-sm" defaultValue="__ALL__">
            <option value="__ALL__">كل المواطنين في المحافظة</option>
            {municipalities.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
        </div>
      ) : null}
      <div>
        <label className="mb-1.5 block text-sm font-medium text-[var(--gov-text)]">العنوان</label>
        <input name="title" required minLength={3} maxLength={120} className="gov-input w-full px-3 py-2.5 text-sm" />
      </div>
      <div>
        <label className="mb-1.5 block text-sm font-medium text-[var(--gov-text)]">نص الخبر</label>
        <textarea
          name="body"
          required
          minLength={5}
          maxLength={3000}
          rows={6}
          className="gov-input w-full resize-y px-3 py-2.5 text-sm leading-7"
        />
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <button type="submit" disabled={pending} className="gov-btn-primary px-5 py-2.5 text-sm font-semibold">
          {pending ? "جاري النشر..." : "نشر الخبر"}
        </button>
        {state && "error" in state ? <p className="text-sm text-rose-700">{state.error}</p> : null}
        {state && "ok" in state ? <p className="text-sm text-emerald-700">{state.message}</p> : null}
      </div>
    </form>
  );
}
