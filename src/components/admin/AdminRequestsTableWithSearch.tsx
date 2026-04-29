"use client";

import Link from "next/link";
import { useMemo, useState, type ReactNode } from "react";
import { RequestStatus } from "@/generated/prisma/enums";
import { requestStatusAr } from "@/lib/labels";
import { StatusBadge } from "@/components/ui/status-badge";
import { AdminListSearchField } from "@/components/admin/AdminListSearchField";

export type AdminRequestRow = {
  id: string;
  requestNumber: string;
  citizenName: string;
  serviceName: string;
  status: RequestStatus;
  createdAt: string;
  detailHref: string;
};

function haystack(r: AdminRequestRow): string {
  return [
    r.requestNumber,
    r.citizenName,
    r.serviceName,
    requestStatusAr[r.status],
    r.createdAt,
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
  const filtered = useMemo(() => {
    const n = q.trim().toLowerCase();
    if (!n) return rows;
    return rows.filter((r) => haystack(r).includes(n));
  }, [rows, q]);

  return (
    <div>
      <header className="gov-page-heading mb-6 border-b border-[var(--gov-border)] pb-4">
        <h1 className="text-lg font-bold text-[var(--gov-text)] md:text-xl">إدارة الطلبات</h1>
        <p className="mt-1 text-sm text-[var(--gov-muted)]">عرض شامل مع تصفية حسب الحالة والتاريخ والبحث في القائمة.</p>
      </header>
      <div className="gov-card mb-6 p-4">{filterForm}</div>
      <AdminListSearchField
        id="admin-requests-search"
        label="بحث في قائمة الطلبات"
        placeholder="رقم الطلب، اسم المواطن، الخدمة، الحالة…"
        value={q}
        onChange={setQ}
        className="mb-4"
      />
      {rows.length === 0 ? (
        <p className="text-center text-sm text-[var(--gov-muted)]">لا طلبات مطابقة</p>
      ) : filtered.length === 0 ? (
        <p className="text-center text-sm text-[var(--gov-muted)]">لا نتائج مطابقة للبحث.</p>
      ) : (
        <div className="gov-table-wrap">
          <table className="gov-table">
            <thead>
              <tr>
                <th>رقم الطلب</th>
                <th>المواطن</th>
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
