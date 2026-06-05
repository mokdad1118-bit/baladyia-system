"use client";

import Link from "next/link";
import { useActionState, useMemo, useState, type ReactNode } from "react";
import { createArchiveEntry } from "@/actions/admin-archive";
import { AdminListSearchField } from "@/components/admin/AdminListSearchField";
import { downloadAdminArchiveExcel, type AdminArchiveExportRow } from "@/lib/admin-archive-export";

export type AdminArchiveRow = AdminArchiveExportRow & {
  id: string;
};

function haystack(row: AdminArchiveRow) {
  return [
    row.requestNumber,
    row.citizenName,
    row.municipalityName,
    row.createdByName,
    row.createdAt,
    row.fileLabel,
  ]
    .join(" ")
    .toLowerCase();
}

function ArchiveCreateForm({
  municipalities,
  fixedMunicipalityId,
}: {
  municipalities: { id: string; name: string }[];
  fixedMunicipalityId?: string;
}) {
  const [state, action] = useActionState(createArchiveEntry, undefined);
  return (
    <form action={action} className="grid gap-3 md:grid-cols-2 xl:grid-cols-5" encType="multipart/form-data">
      {state?.error ? (
        <p className="md:col-span-2 xl:col-span-5 rounded-sm border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800">
          {state.error}
        </p>
      ) : null}
      {state?.ok ? (
        <p className="md:col-span-2 xl:col-span-5 rounded-sm border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
          تم حفظ السجل في الأرشيف.
        </p>
      ) : null}

      {fixedMunicipalityId ? (
        <input type="hidden" name="municipalityId" value={fixedMunicipalityId} />
      ) : (
        <label className="space-y-1.5">
          <span className="block text-sm font-medium text-[var(--gov-text)]">البلدية</span>
          <select name="municipalityId" required className="gov-input w-full px-3 py-2.5 text-sm" defaultValue="">
            <option value="" disabled>
              اختر البلدية
            </option>
            {municipalities.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
        </label>
      )}

      <label className="space-y-1.5">
        <span className="block text-sm font-medium text-[var(--gov-text)]">رقم الطلب</span>
        <input name="requestNumber" required className="gov-input w-full px-3 py-2.5 text-sm" />
      </label>
      <label className="space-y-1.5">
        <span className="block text-sm font-medium text-[var(--gov-text)]">اسم المواطن</span>
        <input name="citizenName" required className="gov-input w-full px-3 py-2.5 text-sm" />
      </label>
      <label className="space-y-1.5">
        <span className="block text-sm font-medium text-[var(--gov-text)]">الملف</span>
        <input
          name="archiveFile"
          type="file"
          accept="image/*,application/pdf"
          required
          className="gov-input w-full px-3 py-2 text-sm file:ms-2 file:rounded-sm file:border-0 file:bg-[var(--gov-primary)] file:px-3 file:py-1.5 file:text-white"
        />
      </label>
      <div className="flex items-end">
        <button type="submit" className="gov-btn-primary min-h-10 w-full px-4 py-2.5 text-sm font-semibold">
          إضافة للأرشيف
        </button>
      </div>
    </form>
  );
}

export function AdminArchiveClient({
  rows,
  filterForm,
  municipalities,
  fixedMunicipalityId,
}: {
  rows: AdminArchiveRow[];
  filterForm: ReactNode;
  municipalities: { id: string; name: string }[];
  fixedMunicipalityId?: string;
}) {
  const [q, setQ] = useState("");
  const [exporting, setExporting] = useState(false);
  const filtered = useMemo(() => {
    const n = q.trim().toLowerCase();
    if (!n) return rows;
    return rows.filter((row) => haystack(row).includes(n));
  }, [rows, q]);

  return (
    <div>
      <header className="gov-page-heading mb-6 border-b border-[var(--gov-border)] pb-4">
        <h1 className="text-lg font-bold text-[var(--gov-text)] md:text-xl">الأرشيف</h1>
        <p className="mt-1 text-sm text-[var(--gov-muted)]">إضافة ملفات الطلبات مع فلترة حسب البلدية والتاريخ.</p>
      </header>

      <section className="gov-card mb-6 p-4">
        <h2 className="mb-4 text-sm font-semibold text-[var(--gov-text)]">إضافة سجل جديد</h2>
        <ArchiveCreateForm municipalities={municipalities} fixedMunicipalityId={fixedMunicipalityId} />
      </section>

      <section className="gov-card mb-6 p-4">{filterForm}</section>

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0 flex-1">
          <AdminListSearchField
            id="admin-archive-search"
            label="بحث في الأرشيف"
            placeholder="رقم الطلب، اسم المواطن، البلدية..."
            value={q}
            onChange={setQ}
            className="mb-0"
          />
        </div>
        <button
          type="button"
          disabled={filtered.length === 0 || exporting}
          className="gov-btn-primary min-h-10 shrink-0 px-4 py-2 text-sm font-semibold disabled:opacity-60"
          onClick={async () => {
            setExporting(true);
            try {
              await downloadAdminArchiveExcel(filtered);
            } finally {
              setExporting(false);
            }
          }}
        >
          {exporting ? "جاري التصدير..." : "تصدير Excel"}
        </button>
      </div>

      {rows.length === 0 ? (
        <p className="text-center text-sm text-[var(--gov-muted)]">لا توجد سجلات أرشيف.</p>
      ) : filtered.length === 0 ? (
        <p className="text-center text-sm text-[var(--gov-muted)]">لا نتائج مطابقة للبحث.</p>
      ) : (
        <div className="gov-table-wrap">
          <table className="gov-table min-w-[58rem]">
            <thead>
              <tr>
                <th>رقم الطلب</th>
                <th>اسم المواطن</th>
                <th>البلدية</th>
                <th>أضيف بواسطة</th>
                <th>التاريخ</th>
                <th>المرفق</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((row) => (
                <tr key={row.id}>
                  <td className="font-mono font-semibold">{row.requestNumber}</td>
                  <td>{row.citizenName}</td>
                  <td>{row.municipalityName}</td>
                  <td>{row.createdByName || "—"}</td>
                  <td className="whitespace-nowrap text-[var(--gov-muted)]">
                    {new Date(row.createdAt).toLocaleDateString("ar")}
                  </td>
                  <td>
                    <Link href={row.fileHref} target="_blank" className="text-[var(--gov-primary)] hover:underline">
                      {row.fileLabel}
                    </Link>
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
