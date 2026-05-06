"use client";

import { useMemo, useState, type ReactNode } from "react";
import { AdminListSearchField } from "@/components/admin/AdminListSearchField";
import { ReturneeRegistrationStatusSelect } from "@/components/admin/ReturneeRegistrationStatusSelect";
import {
  downloadAdminReturneeRegistrationsExcel,
  type ReturneeRegistrationExportRow,
} from "@/lib/admin-returnee-registrations-export";
import type { ReturneeRegistrationStatus } from "@/generated/prisma/enums";
import { returneeRegistrationStatusLabelAr } from "@/lib/returnee-registration-labels";

export type AdminReturneeRegistrationRow = {
  id: string;
  registrationNumber: string;
  fullName: string;
  birthDate: string;
  nationalId: string;
  phone: string;
  email: string;
  returnStatementPath: string;
  createdAt: string;
  status: ReturneeRegistrationStatus;
};

function haystack(r: AdminReturneeRegistrationRow): string {
  return [
    r.registrationNumber,
    r.fullName,
    r.nationalId,
    r.phone,
    r.email,
    r.birthDate,
    r.createdAt,
    returneeRegistrationStatusLabelAr[r.status],
    r.status,
  ]
    .join(" ")
    .toLowerCase();
}

export function AdminReturneeRegistrationsTableWithSearch({
  rows,
  filterForm,
}: {
  rows: AdminReturneeRegistrationRow[];
  filterForm: ReactNode;
}) {
  const [q, setQ] = useState("");
  const [busy, setBusy] = useState(false);
  const filtered = useMemo(() => {
    const n = q.trim().toLowerCase();
    if (!n) return rows;
    return rows.filter((r) => haystack(r).includes(n));
  }, [rows, q]);

  const filteredForExport = useMemo((): ReturneeRegistrationExportRow[] => {
    return filtered.map((r) => ({
      registrationNumber: r.registrationNumber,
      fullName: r.fullName,
      birthDate: r.birthDate,
      nationalId: r.nationalId,
      phone: r.phone,
      email: r.email,
      returnStatementPath: r.returnStatementPath,
      createdAt: r.createdAt,
      statusLabel: returneeRegistrationStatusLabelAr[r.status],
    }));
  }, [filtered]);

  return (
    <div>
      <header className="gov-page-heading mb-6 border-b border-[var(--gov-border)] pb-4">
        <h1 className="text-lg font-bold text-[var(--gov-text)] md:text-xl">تسجيل العائدين</h1>
        <p className="mt-1 text-sm text-[var(--gov-muted)]">
          طلبات المواطنين لتسجيل العائدين مع صورة بيان العودة.
        </p>
      </header>

      <div className="mb-4 grid gap-3 md:grid-cols-3">
        <div className="gov-card p-4">
          <p className="text-xs text-[var(--gov-muted)]">عدد الطلبات</p>
          <p className="mt-1 text-2xl font-bold text-[var(--gov-primary)]">{rows.length}</p>
        </div>
      </div>

      <div className="gov-card mb-6 p-4">{filterForm}</div>

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between">
        <div className="min-w-0 flex-1">
          <AdminListSearchField
            id="admin-returnee-search"
            label="بحث في الطلبات"
            placeholder="رقم الطلب، الاسم، الرقم الوطني، الهاتف، البريد…"
            value={q}
            onChange={setQ}
            className="mb-0"
          />
        </div>

        <button
          type="button"
          disabled={filteredForExport.length === 0 || busy}
          className="gov-btn-primary min-h-10 rounded-sm border-0 px-4 py-2 text-sm font-semibold disabled:opacity-50"
          onClick={async () => {
            setBusy(true);
            try {
              await downloadAdminReturneeRegistrationsExcel(filteredForExport);
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
        <p className="text-center text-sm text-[var(--gov-muted)]">لا توجد طلبات حالياً.</p>
      ) : filtered.length === 0 ? (
        <p className="text-center text-sm text-[var(--gov-muted)]">لا نتائج مطابقة للبحث.</p>
      ) : (
        <div className="gov-table-wrap overflow-x-auto">
          <table className="gov-table min-w-[64rem]">
            <thead>
              <tr>
                <th>رقم الطلب</th>
                <th>الاسم الثلاثي</th>
                <th>تاريخ الميلاد</th>
                <th>الرقم الوطني</th>
                <th>الهاتف</th>
                <th>البريد</th>
                <th>الحالة</th>
                <th>بيان العودة</th>
                <th>تاريخ التقديم</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => (
                <tr key={r.id}>
                  <td className="font-mono font-semibold text-[var(--gov-primary)]">{r.registrationNumber}</td>
                  <td>{r.fullName}</td>
                  <td className="whitespace-nowrap">{new Date(r.birthDate).toLocaleDateString("ar")}</td>
                  <td dir="ltr">{r.nationalId}</td>
                  <td dir="ltr">{r.phone}</td>
                  <td dir="ltr" className="max-w-[12rem] break-all text-sm">
                    {r.email}
                  </td>
                  <td className="align-middle">
                    <ReturneeRegistrationStatusSelect registrationId={r.id} status={r.status} />
                  </td>
                  <td className="align-middle">
                    <div className="flex flex-col items-start gap-2 sm:flex-row sm:items-center">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={r.returnStatementPath}
                        alt={`بيان العودة — ${r.registrationNumber}`}
                        className="max-h-24 max-w-[10rem] rounded-lg border border-[var(--gov-border)] object-contain"
                      />
                      <a
                        href={r.returnStatementPath}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm font-semibold text-[var(--gov-primary)] underline-offset-2 hover:underline"
                      >
                        عرض بالحجم الكامل
                      </a>
                    </div>
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
