"use client";

import { useActionState, useMemo, useState } from "react";
import { sendBroadcastNotification, type BroadcastNotificationState } from "@/actions/admin-broadcast-notifications";

type MunicipalityOption = {
  id: string;
  name: string;
};

export function BroadcastNotificationForm({
  municipalities,
  isSuperAdmin,
  forcedMunicipalityName,
}: {
  municipalities: MunicipalityOption[];
  isSuperAdmin: boolean;
  forcedMunicipalityName?: string | null;
}) {
  const [state, action, pending] = useActionState<BroadcastNotificationState, FormData>(
    sendBroadcastNotification,
    undefined,
  );
  const [scope, setScope] = useState(isSuperAdmin ? "all" : "municipality");
  const municipalityDisabled = !isSuperAdmin || scope === "all";
  const roleOptions = useMemo(
    () =>
      isSuperAdmin
        ? [
            { value: "citizen", label: "مواطن" },
            { value: "municipality_admin", label: "مدير بلدية" },
            { value: "governorate_admin", label: "مدير المحافظة" },
          ]
        : [{ value: "citizen", label: "مواطن" }],
    [isSuperAdmin],
  );

  return (
    <form action={action} className="space-y-4 rounded border border-[var(--gov-border)] bg-white p-4">
      <div className="grid gap-4 md:grid-cols-2">
        <label className="space-y-1 text-sm">
          <span className="font-medium text-slate-700">العنوان</span>
          <input name="title" required maxLength={80} className="gov-input w-full px-3 py-2" />
        </label>
        <label className="space-y-1 text-sm">
          <span className="font-medium text-slate-700">نوع المستخدم</span>
          <select name="targetRole" className="gov-input w-full px-3 py-2" defaultValue="citizen">
            {roleOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <label className="space-y-1 text-sm">
        <span className="font-medium text-slate-700">الوصف</span>
        <textarea name="message" required maxLength={240} rows={4} className="gov-input w-full px-3 py-2" />
      </label>

      <div className="grid gap-4 md:grid-cols-2">
        <label className="space-y-1 text-sm">
          <span className="font-medium text-slate-700">الصورة</span>
          <input name="imageUrl" type="url" placeholder="https://..." className="gov-input w-full px-3 py-2" />
        </label>
        <label className="space-y-1 text-sm">
          <span className="font-medium text-slate-700">رابط الفتح داخل التطبيق</span>
          <input name="openUrl" placeholder="/citizen/notifications" className="gov-input w-full px-3 py-2" />
        </label>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <label className="space-y-1 text-sm">
          <span className="font-medium text-slate-700">النطاق</span>
          <select
            name="targetScope"
            className="gov-input w-full px-3 py-2"
            value={scope}
            onChange={(event) => setScope(event.target.value)}
            disabled={!isSuperAdmin}
          >
            <option value="all">جميع المواطنين</option>
            <option value="municipality">بلدية محددة</option>
          </select>
          {!isSuperAdmin ? (
            <input type="hidden" name="targetScope" value="municipality" />
          ) : null}
        </label>
        <label className="space-y-1 text-sm">
          <span className="font-medium text-slate-700">البلدية</span>
          <select name="municipalityId" className="gov-input w-full px-3 py-2" disabled={municipalityDisabled}>
            <option value="">{forcedMunicipalityName || "اختر البلدية"}</option>
            {municipalities.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
        </label>
      </div>

      {state && "error" in state ? <p className="text-sm text-rose-700">{state.error}</p> : null}
      {state && "ok" in state ? <p className="text-sm text-emerald-700">{state.message}</p> : null}

      <button type="submit" disabled={pending} className="gov-btn w-full px-4 py-2 text-sm md:w-auto">
        {pending ? "جاري الإرسال..." : "إرسال الإشعار"}
      </button>
    </form>
  );
}
