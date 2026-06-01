"use client";

import Link from "next/link";
import { useMemo, useState, type ReactNode } from "react";
import { requestStatusAr } from "@/lib/labels";
import { StatusBadge } from "@/components/ui/status-badge";
import { AdminListSearchField } from "@/components/admin/AdminListSearchField";
import {
  downloadAdminRequestsExcel,
  downloadAdminRequestsPdf,
  type AdminRequestsExportSourceRow,
} from "@/lib/admin-requests-export";

export type AdminRequestRow = AdminRequestsExportSourceRow & {
  id: string;
  detailHref: string;
  nationalId: string;
  phone: string;
  municipalityName: string;
  source: string;
};

function haystack(r: AdminRequestRow): string {
  return [
    r.requestNumber,
    r.citizenName,
    r.nationalId,
    r.phone,
    r.municipalityName,
    sourceLabel(r.source),
    r.serviceName,
    requestStatusAr[r.status],
    r.createdAt,
    ...r.attachments.flatMap((a) => [a.linkLabel, a.href]),
  ]
    .join(" ")
    .toLowerCase();
}

export function AdminRequestsTableWithSearch({
  rows,
  filterForm,
}: {
  rows: AdminRequestRow[];
  /** نموذج التصفية الحالة/التاريخ (من الخادم) */
  filterForm: ReactNode;
}) {
  const [q, setQ] = useState("");
  const [exportBusy, setExportBusy] = useState<"excel" | "pdf" | null>(null);
  const filtered = useMemo(() => {
    const n = q.trim().toLowerCase();
    if (!n) return rows;
    return rows.filter((r) => haystack(r).includes(n));
  }, [rows, q]);

  return (
    <div>
      <header className="gov-page-heading mb-6 border-b border-[var(--gov-border)] pb-4">
        <h1 className="text-lg font-bold text-[var(--gov-text)] md:text-xl">طلبات خدمات المدينة</h1>
        <p className="mt-1 text-sm text-[var(--gov-muted)]">
          مراجعة الطلبات المعروضة مع تصفية حسب الحالة والتاريخ والبحث في القائمة.
        </p>
      </header>
      <div className="gov-card mb-6 p-4">{filterForm}</div>
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between">
        <div className="min-w-0 flex-1">
          <AdminListSearchField
            id="admin-requests-search"
            label="بحث في طلبات خدمات المدينة"
            placeholder="رقم الطلب، اسم المواطن، الخدمة، الحالة…"
            value={q}
            onChange={setQ}
            className="mb-0"
          />
        </div>
        <div className="flex shrink-0 flex-wrap gap-2">
          <button
            type="button"
            disabled={filtered.length === 0 || exportBusy !== null}
            className="gov-btn-primary min-h-10 rounded-sm border-0 px-4 py-2 text-sm font-semibold disabled:opacity-50"
            onClick={async () => {
              setExportBusy("excel");
              try {
                await downloadAdminRequestsExcel(filtered);
              } catch (e) {
                console.error(e);
                alert("تعذر تصدير Excel. حاول مرة أخرى أو من متصفح آخر.");
              } finally {
                setExportBusy(null);
              }
            }}
          >
            {exportBusy === "excel" ? "جاري التصدير…" : "تصدير Excel"}
          </button>
          <button
            type="button"
            disabled={filtered.length === 0 || exportBusy !== null}
            className="gov-btn-primary min-h-10 rounded-sm border-0 px-4 py-2 text-sm font-semibold disabled:opacity-50"
            onClick={async () => {
              setExportBusy("pdf");
              try {
                await downloadAdminRequestsPdf(filtered);
              } catch (e) {
                console.error(e);
                alert("تعذر تصدير PDF. حاول مرة أخرى أو استخدم تصدير Excel.");
              } finally {
                setExportBusy(null);
              }
            }}
          >
            {exportBusy === "pdf" ? "جاري التصدير…" : "تصدير PDF"}
          </button>
        </div>
      </div>
      {rows.length === 0 ? (
        <p className="text-center text-sm text-[var(--gov-muted)]">لا طلبات مطابقة</p>
      ) : filtered.length === 0 ? (
        <p className="text-center text-sm text-[var(--gov-muted)]">لا نتائج مطابقة للبحث.</p>
      ) : (
        <div className="gov-table-wrap">
          <table className="gov-table min-w-[72rem]">
            <thead>
              <tr>
                <th>رقم الطلب</th>
                <th>المواطن</th>
                <th>الرقم الوطني</th>
                <th>رقم الواتساب</th>
                <th>البلدية</th>
                <th>مصدر الطلب</th>
                <th>الخدمة</th>
                <th>الحالة</th>
                <th>التاريخ</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => (
                <tr key={r.id}>
                  <td>
                    <Link
                      href={r.detailHref}
                      className="font-mono font-semibold text-[var(--gov-primary)] hover:underline"
                    >
                      {r.requestNumber}
                    </Link>
                  </td>
                  <td>{r.citizenName}</td>
                  <td dir="ltr">{r.nationalId || "—"}</td>
                  <td dir="ltr">{r.phone || "—"}</td>
                  <td>{r.municipalityName || "—"}</td>
                  <td>{sourceLabel(r.source)}</td>
                  <td>{r.serviceName}</td>
                  <td>
                    <StatusBadge status={r.status} />
                  </td>
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

function sourceLabel(source: string) {
  return source === "in_person" ? "حضوري" : "التطبيق";
}
