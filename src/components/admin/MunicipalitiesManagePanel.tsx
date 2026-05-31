"use client";

import { useActionState, useMemo, useState } from "react";
import {
  createMunicipality,
  deleteMunicipality,
  setMunicipalityActive,
  updateMunicipality,
} from "@/actions/admin-municipalities";
import { AdminListSearchField } from "@/components/admin/AdminListSearchField";
import Link from "next/link";
import { useRouter } from "next/navigation";

export type MunicipalityAdminRow = {
  id: string;
  name: string;
  code: string;
  sortOrder: number;
  isActive: boolean;
  governorate: string;
  citizens: number;
  requests: number;
};

function haystack(m: MunicipalityAdminRow) {
  return `${m.name} ${m.code} ${m.governorate} ${m.sortOrder}`.toLowerCase();
}

export function MunicipalitiesManagePanel({ rows }: { rows: MunicipalityAdminRow[] }) {
  const [createSt, createAct, createPending] = useActionState(createMunicipality, undefined);
  const [q, setQ] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const n = q.trim().toLowerCase();
    if (!n) return rows;
    return rows.filter((r) => haystack(r).includes(n));
  }, [rows, q]);

  const editing = editingId ? rows.find((r) => r.id === editingId) : null;

  return (
    <div className="space-y-6">
      <header className="gov-page-heading border-b border-[var(--gov-border)] pb-4">
        <h1 className="text-lg font-bold text-[var(--gov-text)] md:text-xl">إدارة البلديات</h1>
        <p className="mt-1 text-sm text-[var(--gov-muted)]">
          إضافة بلديات جديدة وتعديل الأسماء والترتيب. التعطيل يخفي البلدية من تسجيل المواطن دون حذف
          البيانات.
        </p>
        <p className="mt-2">
          <Link
            href="/admin/municipalities/compare"
            className="text-sm font-semibold text-[var(--gov-primary)] hover:underline"
          >
            عرض تقرير المقارنة بين البلديات ←
          </Link>
        </p>
      </header>

      <div className="gov-card p-4 md:p-5">
        <h2 className="mb-3 text-base font-bold text-[var(--gov-text)]">إضافة بلدية</h2>
        <form action={createAct} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {createSt?.error && (
            <p className="sm:col-span-2 lg:col-span-4 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800">
              {createSt.error}
            </p>
          )}
          {createSt?.ok && (
            <p className="sm:col-span-2 lg:col-span-4 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
              تمت إضافة البلدية
            </p>
          )}
          <div>
            <label className="mb-1.5 block text-sm font-medium">اسم البلدية</label>
            <input name="name" required minLength={2} className="gov-input w-full px-3 py-2.5 text-sm" />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium">المعرّف (code)</label>
            <input
              name="code"
              required
              dir="ltr"
              pattern="[a-z0-9]+(-[a-z0-9]+)*"
              placeholder="مثل: new-town"
              className="gov-input w-full px-3 py-2.5 text-sm"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium">ترتيب العرض (اختياري)</label>
            <input
              name="sortOrder"
              type="number"
              min={0}
              className="gov-input w-full px-3 py-2.5 text-sm"
              placeholder="تلقائي"
            />
          </div>
          <div className="flex items-end">
            <button
              type="submit"
              disabled={createPending}
              className="gov-btn-primary w-full px-4 py-2.5 text-sm font-semibold disabled:opacity-60"
            >
              {createPending ? "جاري الحفظ…" : "إضافة"}
            </button>
          </div>
        </form>
      </div>

      {editing ? <MunicipalityEditCard row={editing} onClose={() => setEditingId(null)} /> : null}

      <div className="gov-card p-4">
        <AdminListSearchField
          id="municipalities-search"
          label="بحث في البلديات"
          placeholder="الاسم، المعرّف…"
          value={q}
          onChange={setQ}
          className="mb-4"
        />
        <div className="gov-table-wrap overflow-x-auto">
          <table className="gov-table min-w-[48rem]">
            <thead>
              <tr>
                <th>الاسم</th>
                <th>المعرّف</th>
                <th>الترتيب</th>
                <th>مواطنون</th>
                <th>طلبات</th>
                <th>الحالة</th>
                <th>إجراء</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center text-sm text-[var(--gov-muted)]">
                    لا نتائج
                  </td>
                </tr>
              ) : (
                filtered.map((m) => (
                  <tr key={m.id} className={!m.isActive ? "opacity-60" : undefined}>
                    <td className="font-medium">
                      <Link
                        href={`/admin/municipalities/${m.id}`}
                        className="text-[var(--gov-primary)] underline-offset-2 hover:underline"
                      >
                        {m.name}
                      </Link>
                    </td>
                    <td dir="ltr" className="text-sm">
                      {m.code}
                    </td>
                    <td>{m.sortOrder}</td>
                    <td>{m.citizens}</td>
                    <td>{m.requests}</td>
                    <td>{m.isActive ? "مفعّلة" : "معطّلة"}</td>
                    <td className="whitespace-nowrap">
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          className="gov-btn-secondary px-2 py-1 text-xs"
                          onClick={() => setEditingId(m.id)}
                        >
                          تعديل
                        </button>
                        <MunicipalityActiveToggle id={m.id} isActive={m.isActive} name={m.name} />
                        <MunicipalityDeleteButton row={m} />
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-xs text-[var(--gov-muted)]">
          إجمالي البلديات: {rows.length} — المعروض: {filtered.length}
        </p>
      </div>
    </div>
  );
}

function MunicipalityDeleteButton({ row }: { row: MunicipalityAdminRow }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const hasData = row.citizens + row.requests > 0;
  return (
    <button
      type="button"
      disabled={pending}
      className="rounded-sm border border-rose-200 px-2 py-1 text-xs font-semibold text-rose-700 disabled:opacity-60"
      title={hasData ? "لا يُحذف إلا إذا لم تكن هناك بيانات مرتبطة" : undefined}
      onClick={async () => {
        const warning = hasData
          ? "هذه البلدية لديها بيانات ظاهرة. سيُرفض الحذف إذا وُجدت أي بيانات مرتبطة. هل تريد المحاولة؟"
          : `حذف بلدية «${row.name}»؟ لا يمكن التراجع عن هذا الإجراء.`;
        if (!confirm(warning)) return;
        setPending(true);
        const res = await deleteMunicipality(row.id);
        setPending(false);
        if (res.error) alert(res.error);
        else router.refresh();
      }}
    >
      {pending ? "…" : "حذف"}
    </button>
  );
}

function MunicipalityEditCard({
  row,
  onClose,
}: {
  row: MunicipalityAdminRow;
  onClose: () => void;
}) {
  const [st, act, pending] = useActionState(updateMunicipality, undefined);
  return (
    <div className="gov-card border-2 border-[var(--gov-primary)]/30 p-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2 className="text-base font-bold">تعديل: {row.name}</h2>
        <button type="button" className="text-sm text-[var(--gov-muted)] hover:underline" onClick={onClose}>
          إغلاق
        </button>
      </div>
      <form action={act} className="grid gap-3 sm:grid-cols-3">
        <input type="hidden" name="id" value={row.id} />
        {st?.error && (
          <p className="sm:col-span-3 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-800">{st.error}</p>
        )}
        {st?.ok && (
          <p className="sm:col-span-3 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
            تم الحفظ
          </p>
        )}
        <div>
          <label className="mb-1.5 block text-sm font-medium">الاسم</label>
          <input
            name="name"
            required
            defaultValue={row.name}
            className="gov-input w-full px-3 py-2.5 text-sm"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium">المعرّف</label>
          <input
            value={row.code}
            disabled
            dir="ltr"
            className="gov-input w-full bg-slate-100 px-3 py-2.5 text-sm opacity-80"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium">ترتيب العرض</label>
          <input
            name="sortOrder"
            type="number"
            required
            defaultValue={row.sortOrder}
            className="gov-input w-full px-3 py-2.5 text-sm"
          />
        </div>
        <div className="sm:col-span-3">
          <button
            type="submit"
            disabled={pending}
            className="gov-btn-primary px-5 py-2.5 text-sm font-semibold disabled:opacity-60"
          >
            {pending ? "جاري الحفظ…" : "حفظ التعديلات"}
          </button>
        </div>
      </form>
    </div>
  );
}

function MunicipalityActiveToggle({
  id,
  isActive,
  name,
}: {
  id: string;
  isActive: boolean;
  name: string;
}) {
  const [pending, setPending] = useState(false);
  return (
    <button
      type="button"
      disabled={pending}
      className="gov-btn-secondary px-2 py-1 text-xs disabled:opacity-60"
      onClick={async () => {
        if (!confirm(`${isActive ? "تعطيل" : "تفعيل"} بلدية «${name}»؟`)) return;
        setPending(true);
        const res = await setMunicipalityActive(id, !isActive);
        setPending(false);
        if (res.error) alert(res.error);
      }}
    >
      {pending ? "…" : isActive ? "تعطيل" : "تفعيل"}
    </button>
  );
}
