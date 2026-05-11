"use client";

import { useMemo, useState } from "react";
import type { SocialServiceCaseStatus } from "@/generated/prisma/enums";
import { AdminListSearchField } from "@/components/admin/AdminListSearchField";
import { SocialServiceCaseStatusSelect } from "@/components/admin/SocialServiceCaseStatusSelect";
import { downloadAdminSocialServicesExcel, downloadAdminSocialServicesPdf, type SocialServiceExportRow } from "@/lib/admin-social-service-export";

export type AdminSocialServiceRow = {
  id: string;
  caseNumber: string;
  categoryLabel: string;
  ownerName: string;
  nationalId: string;
  phone: string;
  createdAt: string;
  status: SocialServiceCaseStatus;
  statusLabel: string;
  attachments: { href: string; label: string }[];
};

function haystack(r: AdminSocialServiceRow) {
  return [r.caseNumber, r.categoryLabel, r.ownerName, r.nationalId, r.phone, r.statusLabel].join(" ").toLowerCase();
}

export function AdminSocialServicesTableWithSearch({ title, rows }: { title: string; rows: AdminSocialServiceRow[] }) {
  const [q, setQ] = useState("");
  const [busy, setBusy] = useState<"" | "excel" | "pdf">("");
  const filtered = useMemo(() => {
    const n = q.trim().toLowerCase();
    if (!n) return rows;
    return rows.filter((r) => haystack(r).includes(n));
  }, [rows, q]);
  const exportRows = useMemo<SocialServiceExportRow[]>(
    () =>
      filtered.map((r) => ({
        caseNumber: r.caseNumber,
        category: r.categoryLabel,
        ownerName: r.ownerName,
        nationalId: r.nationalId,
        phone: r.phone,
        statusLabel: r.statusLabel,
        createdAt: r.createdAt,
        attachments: r.attachments,
      })),
    [filtered],
  );

  return (
    <div>
      <header className="gov-page-heading mb-6 border-b border-[var(--gov-border)] pb-4">
        <h1 className="text-lg font-bold text-[var(--gov-text)] md:text-xl">{title}</h1>
      </header>
      <div className="mb-4 flex flex-col gap-3 sm:flex-row">
        <div className="min-w-0 flex-1">
          <AdminListSearchField id="admin-social-search" label="بحث في الطلبات" placeholder="رقم الطلب، الاسم، الرقم الوطني، الهاتف..." value={q} onChange={setQ} className="mb-0" />
        </div>
        <button type="button" disabled={!filtered.length || !!busy} className="gov-btn-primary min-h-10 rounded-sm border-0 px-4 py-2 text-sm font-semibold disabled:opacity-50" onClick={async () => { setBusy("excel"); try { await downloadAdminSocialServicesExcel(exportRows); } finally { setBusy(""); } }}>{busy === "excel" ? "جاري التصدير…" : "تصدير Excel"}</button>
        <button type="button" disabled={!filtered.length || !!busy} className="gov-btn-primary min-h-10 rounded-sm border-0 px-4 py-2 text-sm font-semibold disabled:opacity-50" onClick={async () => { setBusy("pdf"); try { await downloadAdminSocialServicesPdf(exportRows); } finally { setBusy(""); } }}>{busy === "pdf" ? "جاري التصدير…" : "تصدير PDF"}</button>
      </div>
      {filtered.length === 0 ? (
        <p className="text-center text-sm text-[var(--gov-muted)]">لا توجد طلبات.</p>
      ) : (
        <div className="gov-table-wrap overflow-x-auto">
          <table className="gov-table min-w-[72rem]">
            <thead><tr><th>رقم الطلب</th><th>القسم</th><th>الاسم</th><th>الرقم الوطني</th><th>الهاتف</th><th>الحالة</th><th>المرفقات</th><th>تاريخ التقديم</th></tr></thead>
            <tbody>
              {filtered.map((r) => (
                <tr key={r.id}>
                  <td className="font-mono font-semibold text-[var(--gov-primary)]">{r.caseNumber}</td>
                  <td>{r.categoryLabel}</td>
                  <td>{r.ownerName}</td>
                  <td dir="ltr">{r.nationalId || "—"}</td>
                  <td dir="ltr">{r.phone}</td>
                  <td><SocialServiceCaseStatusSelect caseId={r.id} status={r.status} /></td>
                  <td>{r.attachments.length ? r.attachments.map((a) => <a key={a.href} href={a.href} target="_blank" rel="noopener noreferrer" className="me-2 inline-flex min-h-8 items-center rounded border border-[var(--gov-border)] bg-white px-2 text-xs font-semibold text-[var(--gov-primary)] no-underline">{a.label}</a>) : "—"}</td>
                  <td className="whitespace-nowrap text-[var(--gov-muted)]">{new Date(r.createdAt).toLocaleDateString("ar")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
