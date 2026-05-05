"use client";

import { useState } from "react";
import { createGasAgentAction } from "@/actions/gas-agents";

export function GasAgentCreateForm() {
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
          <button
            type="submit"
            disabled={pending}
            className="gov-btn-primary min-h-10 rounded-sm px-4 py-2 text-sm font-semibold disabled:opacity-60"
          >
            {pending ? "جارٍ الإنشاء..." : "إنشاء الحساب"}
          </button>
          {msg ? <p className="text-sm text-emerald-700">{msg}</p> : null}
          {err ? <p className="text-sm text-rose-700">{err}</p> : null}
        </div>
      </form>
    </div>
  );
}
