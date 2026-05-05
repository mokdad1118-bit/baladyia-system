"use client";

import { useState } from "react";

export function CitizenAccountView({
  user,
}: {
  user: {
    name: string | null;
    email: string | null;
    phone: string | null;
    nationalId: string | null;
    notificationEmail: string | null;
    createdAt: string;
  };
}) {
  const [showPassword, setShowPassword] = useState(false);

  const rows: { label: string; value: string }[] = [
    { label: "الاسم الثلاثي", value: user.name ?? "—" },
    { label: "البريد الإلكتروني", value: user.email ?? "—" },
    { label: "رقم الهاتف", value: user.phone ?? "—" },
    { label: "الرقم الوطني", value: user.nationalId ?? "—" },
    { label: "بريد الإشعارات", value: user.notificationEmail ?? "—" },
    { label: "تاريخ إنشاء الحساب", value: new Date(user.createdAt).toLocaleDateString("ar") },
  ];

  return (
    <div className="gov-card p-4 md:p-6">
      <h1 className="mb-1 text-lg font-bold text-[var(--gov-text)] md:text-xl">حسابي</h1>
      <p className="mb-4 text-sm text-[var(--gov-muted)]">عرض بيانات الحساب فقط (غير قابل للتعديل).</p>

      <div className="mb-4 rounded-xl border border-[var(--gov-border)] p-3">
        <p className="mb-2 text-sm font-medium text-[var(--gov-text)]">كلمة السر</p>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <code className="rounded bg-slate-100 px-2 py-1 text-sm">
            {showPassword ? "********" : "••••••••"}
          </code>
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            className="rounded-lg border border-[var(--gov-border)] bg-white px-3 py-1.5 text-xs font-semibold text-[var(--gov-primary)] hover:bg-[#f7faf8]"
          >
            {showPassword ? "إخفاء كلمة السر" : "إظهار كلمة السر"}
          </button>
        </div>
      </div>

      <div className="gov-table-wrap">
        <table className="gov-table">
          <tbody>
            {rows.map((r) => (
              <tr key={r.label}>
                <th className="w-[12rem]">{r.label}</th>
                <td dir={r.label.includes("رقم") ? "ltr" : "auto"}>{r.value}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
