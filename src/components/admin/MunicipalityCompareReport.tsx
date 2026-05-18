"use client";

import { useMemo, useState } from "react";
import type { MunicipalityCompareRow } from "@/lib/municipality-compare-stats";
import { AdminListSearchField } from "@/components/admin/AdminListSearchField";
import Link from "next/link";

type SortKey = keyof Pick<
  MunicipalityCompareRow,
  | "name"
  | "citizens"
  | "staff"
  | "requests"
  | "requestsPending"
  | "requestsCompleted"
  | "gasRequests"
  | "socialCases"
  | "returnees"
  | "feedback"
>;

const columns: { key: SortKey; label: string }[] = [
  { key: "name", label: "البلدية" },
  { key: "citizens", label: "مواطنون" },
  { key: "staff", label: "موظفون" },
  { key: "requests", label: "طلبات خدمات" },
  { key: "requestsPending", label: "طلبات جديدة" },
  { key: "requestsCompleted", label: "طلبات مكتملة" },
  { key: "gasRequests", label: "غاز" },
  { key: "socialCases", label: "اجتماعية" },
  { key: "returnees", label: "عائدون" },
  { key: "feedback", label: "شكاوى" },
];

function haystack(r: MunicipalityCompareRow) {
  return `${r.name} ${r.code}`.toLowerCase();
}

export function MunicipalityCompareReport({
  rows,
  totals,
}: {
  rows: MunicipalityCompareRow[];
  totals: Omit<MunicipalityCompareRow, "id" | "name" | "code" | "isActive" | "sortOrder">;
}) {
  const [q, setQ] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("requests");
  const [sortDesc, setSortDesc] = useState(true);

  const filtered = useMemo(() => {
    const n = q.trim().toLowerCase();
    let list = n ? rows.filter((r) => haystack(r).includes(n)) : [...rows];
    list.sort((a, b) => {
      if (sortKey === "name") {
        const cmp = a.name.localeCompare(b.name, "ar");
        return sortDesc ? -cmp : cmp;
      }
      const av = a[sortKey] as number;
      const bv = b[sortKey] as number;
      return sortDesc ? bv - av : av - bv;
    });
    return list;
  }, [rows, q, sortKey, sortDesc]);

  return (
    <div className="space-y-6">
      <header className="gov-page-heading border-b border-[var(--gov-border)] pb-4">
        <h1 className="text-lg font-bold text-[var(--gov-text)] md:text-xl">
          تقرير مقارنة البلديات
        </h1>
        <p className="mt-1 text-sm text-[var(--gov-muted)]">
          نظرة مقارنة على مستوى محافظة درعا — جميع البلديات المسجّلة في النظام.
        </p>
        <p className="mt-2">
          <Link
            href="/admin/municipalities"
            className="text-sm font-semibold text-[var(--gov-primary)] hover:underline"
          >
            إدارة البلديات ←
          </Link>
        </p>
      </header>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <SummaryCard label="إجمالي المواطنين" value={totals.citizens} />
        <SummaryCard label="إجمالي الطلبات" value={totals.requests} />
        <SummaryCard label="طلبات الغاز" value={totals.gasRequests} />
        <SummaryCard label="الخدمات الاجتماعية" value={totals.socialCases} />
      </div>

      <div className="gov-card p-4">
        <div className="mb-4 flex flex-wrap items-end gap-3">
          <AdminListSearchField
            id="compare-mun-search"
            label="بحث"
            placeholder="اسم البلدية…"
            value={q}
            onChange={setQ}
            className="min-w-[12rem] flex-1"
          />
          <div>
            <label className="mb-1.5 block text-sm font-medium">ترتيب حسب</label>
            <select
              className="gov-input px-3 py-2 text-sm"
              value={sortKey}
              onChange={(e) => setSortKey(e.target.value as SortKey)}
            >
              {columns.map((c) => (
                <option key={c.key} value={c.key}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>
          <button
            type="button"
            className="gov-btn-secondary px-3 py-2 text-sm"
            onClick={() => setSortDesc((v) => !v)}
          >
            {sortDesc ? "الأعلى أولاً" : "الأقل أولاً"}
          </button>
        </div>

        <div className="gov-table-wrap overflow-x-auto">
          <table className="gov-table min-w-[64rem] text-sm">
            <thead>
              <tr>
                <th>البلدية</th>
                <th>الحالة</th>
                {columns.slice(1).map((c) => (
                  <th key={c.key}>{c.label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => (
                <tr key={r.id} className={!r.isActive ? "opacity-55" : undefined}>
                  <td className="font-medium">
                    {r.name}
                    <span className="mt-0.5 block text-xs text-[var(--gov-muted)]" dir="ltr">
                      {r.code}
                    </span>
                  </td>
                  <td>{r.isActive ? "مفعّلة" : "معطّلة"}</td>
                  <td className="tabular-nums">{r.citizens}</td>
                  <td className="tabular-nums">{r.staff}</td>
                  <td className="tabular-nums font-semibold">{r.requests}</td>
                  <td className="tabular-nums">{r.requestsPending}</td>
                  <td className="tabular-nums">{r.requestsCompleted}</td>
                  <td className="tabular-nums">{r.gasRequests}</td>
                  <td className="tabular-nums">{r.socialCases}</td>
                  <td className="tabular-nums">{r.returnees}</td>
                  <td className="tabular-nums">{r.feedback}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-slate-50/90 font-semibold">
                <td colSpan={2}>المجموع (كل البلديات)</td>
                <td className="tabular-nums">{totals.citizens}</td>
                <td className="tabular-nums">{totals.staff}</td>
                <td className="tabular-nums">{totals.requests}</td>
                <td className="tabular-nums">{totals.requestsPending}</td>
                <td className="tabular-nums">{totals.requestsCompleted}</td>
                <td className="tabular-nums">{totals.gasRequests}</td>
                <td className="tabular-nums">{totals.socialCases}</td>
                <td className="tabular-nums">{totals.returnees}</td>
                <td className="tabular-nums">{totals.feedback}</td>
              </tr>
            </tfoot>
          </table>
        </div>
        <p className="mt-3 text-xs text-[var(--gov-muted)]">
          {filtered.length} بلدية معروضة من أصل {rows.length}
        </p>
      </div>
    </div>
  );
}

function SummaryCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="gov-card p-4">
      <p className="text-sm text-[var(--gov-muted)]">{label}</p>
      <p className="mt-1 text-2xl font-bold tabular-nums text-[var(--gov-text)]">{value}</p>
    </div>
  );
}
