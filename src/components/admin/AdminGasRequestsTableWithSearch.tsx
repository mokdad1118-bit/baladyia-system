"use client";

import { useMemo, useState, type ReactNode } from "react";
import { AdminListSearchField } from "@/components/admin/AdminListSearchField";
import {
  downloadAdminGasRequestsExcel,
  type GasRequestExportRow,
} from "@/lib/admin-gas-requests-export";

export type AdminGasRequestRow = GasRequestExportRow & {
  id: string;
};

function haystack(r: AdminGasRequestRow): string {
  return [r.gasRequestNumber, r.area, r.agentName, r.fullName, r.phone, r.nationalId, r.createdAt]
    .join(" ")
    .toLowerCase();
}

export function AdminGasRequestsTableWithSearch({
  rows,
  filterForm,
}: {
  rows: AdminGasRequestRow[];
  filterForm: ReactNode;
}) {
  const [q, setQ] = useState("");
  const [busy, setBusy] = useState(false);
  const filtered = useMemo(() => {
    const n = q.trim().toLowerCase();
    if (!n) return rows;
    return rows.filter((r) => haystack(r).includes(n));
  }, [rows, q]);

  return (
    <div>
      <header className="gov-page-heading mb-6 border-b border-[var(--gov-border)] pb-4">
        <h1 className="text-lg font-bold text-[var(--gov-text)] md:text-xl">خدمات الغاز</h1>
        <p className="mt-1 text-sm text-[var(--gov-muted)]">طلبات المواطنين لخدمات الغاز.</p>
      </header>

      <div className="mb-4 grid gap-3 md:grid-cols-3">
        <div className="gov-card p-4">
          <p className="text-xs text-[var(--gov-muted)]">عدد الطلبات المقدمة</p>
          <p className="mt-1 text-2xl font-bold text-[var(--gov-primary)]">{rows.length}</p>
        </div>
      </div>

      <div className="gov-card mb-6 p-4">{filterForm}</div>

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between">
        <div className="min-w-0 flex-1">
          <AdminListSearchField
            id="admin-gas-requests-search"
            label="بحث في طلبات الغاز"
            placeholder="رقم الطلب، المنطقة، المعتمد، اسم المواطن، الرقم الوطني، رقم الهاتف…"
            value={q}
            onChange={setQ}
            className="mb-0"
          />
        </div>

        <button
          type="button"
          disabled={filtered.length === 0 || busy}
          className="gov-btn-primary min-h-10 rounded-sm border-0 px-4 py-2 text-sm font-semibold disabled:opacity-50"
          onClick={async () => {
            setBusy(true);
            try {
              await downloadAdminGasRequestsExcel(filtered);
            } catch (e) {
              console.error(e);
              alert("تعذر تصدير Excel. حاول مرة أخرى.");
            } finally {
              setBusy(false);
            }
          }}
        >
          {busy ? "جاري التصدير…" : "تصدير Excel"}
        </button>
      </div>

      {rows.length === 0 ? (
        <p className="text-center text-sm text-[var(--gov-muted)]">لا توجد طلبات غاز حالياً.</p>
      ) : filtered.length === 0 ? (
        <p className="text-center text-sm text-[var(--gov-muted)]">لا نتائج مطابقة للبحث.</p>
      ) : (
        <div className="gov-table-wrap">
          <table className="gov-table">
            <thead>
              <tr>
                <th>رقم طلب الغاز</th>
                <th>المنطقة</th>
                <th>المعتمد</th>
                <th>الاسم الثلاثي</th>
                <th>رقم الهاتف</th>
                <th>الرقم الوطني</th>
                <th>تاريخ التقديم</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => (
                <tr key={r.id}>
                  <td className="font-mono font-semibold text-[var(--gov-primary)]">{r.gasRequestNumber}</td>
                  <td>{r.area}</td>
                  <td>{r.agentName || "—"}</td>
                  <td>{r.fullName}</td>
                  <td dir="ltr">{r.phone}</td>
                  <td dir="ltr">{r.nationalId}</td>
                  <td className="whitespace-nowrap text-[var(--gov-muted)]">
                    {new Date(r.createdAt).toLocaleDateString("ar")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
