"use client";

import { useMemo, useState } from "react";
import { AdminListSearchField } from "@/components/admin/AdminListSearchField";

type GasAgentRequestRow = {
  id: string;
  gasRequestNumber: string;
  fullName: string;
  phone: string;
  nationalId: string;
  area: string;
  createdAt: string;
};

function haystack(r: GasAgentRequestRow): string {
  return [r.gasRequestNumber, r.fullName].join(" ").toLowerCase();
}

export function GasAgentRequestsTableWithSearch({ rows }: { rows: GasAgentRequestRow[] }) {
  const [q, setQ] = useState("");
  const filtered = useMemo(() => {
    const n = q.trim().toLowerCase();
    if (!n) return rows;
    return rows.filter((r) => haystack(r).includes(n));
  }, [rows, q]);

  if (rows.length === 0) {
    return (
      <div className="gov-card p-10 text-center text-sm text-[var(--gov-muted)]">
        لا توجد طلبات غاز مخصصة لك حالياً.
      </div>
    );
  }

  return (
    <div>
      <AdminListSearchField
        id="gas-agent-requests-search"
        label="بحث في الطلبات"
        placeholder="ابحث برقم الطلب أو اسم المواطن..."
        value={q}
        onChange={setQ}
        className="mb-4"
      />

      {filtered.length === 0 ? (
        <div className="gov-card p-8 text-center text-sm text-[var(--gov-muted)]">لا نتائج مطابقة للبحث.</div>
      ) : (
        <div className="gov-table-wrap">
          <table className="gov-table">
            <thead>
              <tr>
                <th>رقم طلب الغاز</th>
                <th>الاسم الثلاثي</th>
                <th>رقم الهاتف</th>
                <th>الرقم الوطني</th>
                <th>المنطقة</th>
                <th>تاريخ التقديم</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => (
                <tr key={r.id}>
                  <td className="font-mono font-semibold text-[var(--gov-primary)]">{r.gasRequestNumber}</td>
                  <td>{r.fullName}</td>
                  <td dir="ltr">{r.phone}</td>
                  <td dir="ltr">{r.nationalId}</td>
                  <td>{r.area}</td>
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
