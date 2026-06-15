"use client";

import { useState } from "react";
import { createGasAgentAction } from "@/actions/gas-agents";

export function GasAgentCreateForm({
  municipalities = [],
  showMunicipalityPicker = false,
  canManageInventory = false,
}: {
  municipalities?: { id: string; name: string }[];
  showMunicipalityPicker?: boolean;
  canManageInventory?: boolean;
}) {
  const [pending, setPending] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  return (
    <div className="gov-card mb-6 p-4">
      <h2 className="mb-3 text-base font-bold text-[var(--gov-text)]">إنشاء حساب معتمد غاز</h2>
      <form
        className="grid gap-3 md:grid-cols-2"
        onSubmit={async (e) => {
          e.preventDefault();
          setPending(true);
          setMsg(null);
          setErr(null);
          const fd = new FormData(e.currentTarget);
          const res = await createGasAgentAction(fd);
          setPending(false);
          if (!res.ok) {
            setErr(res.error);
            return;
          }
          setMsg(res.message);
          (e.currentTarget as HTMLFormElement).reset();
        }}
      >
        {showMunicipalityPicker && municipalities.length > 0 ? (
          <div className="md:col-span-2">
            <label className="mb-1.5 block text-sm font-medium text-[var(--gov-text)]">البلدية</label>
            <select name="municipalityId" required className="gov-input w-full px-3 py-2.5 text-sm" defaultValue="">
              <option value="" disabled>
                — اختر البلدية —
              </option>
              {municipalities.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
          </div>
        ) : null}
        <div>
          <label className="mb-1.5 block text-sm font-medium text-[var(--gov-text)]">اسم المعتمد</label>
          <input name="name" required minLength={3} className="gov-input w-full px-3 py-2.5 text-sm" />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-[var(--gov-text)]">رقم الهاتف</label>
          <input
            name="phone"
            required
            inputMode="numeric"
            dir="ltr"
            className="gov-input w-full px-3 py-2.5 text-sm"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-[var(--gov-text)]">المنطقة المخصصة</label>
          <input name="area" required className="gov-input w-full px-3 py-2.5 text-sm" />
        </div>
        {canManageInventory ? (
          <div>
            <label className="mb-1.5 block text-sm font-medium text-[var(--gov-text)]">عدد جرار الغاز الأولي</label>
            <input
              name="initialStock"
              type="number"
              min={0}
              step={1}
              defaultValue={0}
              inputMode="numeric"
              className="gov-input w-full px-3 py-2.5 text-sm"
            />
          </div>
        ) : null}
        <div>
          <label className="mb-1.5 block text-sm font-medium text-[var(--gov-text)]">كلمة مرور المعتمد</label>
          <input
            name="password"
            type="password"
            required
            minLength={6}
            className="gov-input w-full px-3 py-2.5 text-sm"
          />
        </div>
        <div className="md:col-span-2 flex items-center gap-3">
          <button type="submit" disabled={pending} className="gov-btn-primary px-5 py-2.5 text-sm font-semibold">
            {pending ? "جاري الحفظ…" : "إنشاء المعتمد"}
          </button>
          {msg ? <p className="text-sm text-emerald-700">{msg}</p> : null}
          {err ? <p className="text-sm text-rose-700">{err}</p> : null}
        </div>
      </form>
    </div>
  );
}
