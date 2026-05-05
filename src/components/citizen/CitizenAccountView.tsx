"use client";

import { useState } from "react";
import Link from "next/link";

export function CitizenAccountView({
  user,
  passwordRecoveryHref = "/citizen/forgot-password",
}: {
  user: {
    name: string | null;
    email: string | null;
    phone: string | null;
    nationalId: string | null;
    notificationEmail: string | null;
    createdAt: string;
  };
  /** صفحة استعادة/تغيير كلمة المرور (لا يُعرض النص الفعلي لأسباب أمنية) */
  passwordRecoveryHref?: string;
}) {
  const [showPasswordInfo, setShowPasswordInfo] = useState(false);

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
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            {showPasswordInfo ? (
              <div className="space-y-2 text-sm text-[var(--gov-text)]">
                <p>
                  لا يمكن عرض كلمة السر التي أدخلتها عند التسجيل؛ النظام يحفظها{" "}
                  <span className="font-semibold">مشفّرة فقط</span> لأمان حسابك ولا يمكن استرجاع النص
                  الأصلي لعرضه هنا.
                </p>
                <p className="text-[var(--gov-muted)]">
                  إذا نسيت كلمة السر أو أردت تعيين كلمة جديدة، استخدم صفحة استعادة كلمة المرور.
                </p>
                <Link
                  href={passwordRecoveryHref}
                  className="inline-flex min-h-10 items-center font-semibold text-[var(--gov-primary)] hover:underline"
                >
                  الانتقال إلى استعادة كلمة المرور ←
                </Link>
              </div>
            ) : (
              <code
                className="inline-block rounded bg-slate-100 px-2 py-1.5 text-base tracking-widest text-slate-700"
                aria-hidden
              >
                ••••••••••••
              </code>
            )}
          </div>
          <button
            type="button"
            aria-pressed={showPasswordInfo}
            onClick={() => setShowPasswordInfo((v) => !v)}
            className="shrink-0 rounded-lg border border-[var(--gov-border)] bg-white px-3 py-1.5 text-xs font-semibold text-[var(--gov-primary)] hover:bg-[#f7faf8]"
          >
            {showPasswordInfo ? "إخفاء معلومات كلمة السر" : "إظهار معلومات كلمة السر"}
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
