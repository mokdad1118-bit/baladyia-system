"use client";

import Link from "next/link";
import { useMemo, useState, type ReactNode } from "react";
import { AdminListSearchField } from "@/components/admin/AdminListSearchField";
import { Badge } from "@/components/ui/badge";

export type OperationLogRow = {
  id: string;
  createdAt: string;
  action: string;
  module: string;
  title: string;
  description: string;
  actorName: string;
  actorRole: string;
  requestNumber: string;
  citizenName: string;
  serviceName: string;
  requestHref: string | null;
  entityType: string;
  entityId: string;
  ipAddress: string;
  metadata: string;
};

const actionLabels: Record<string, string> = {
  LOGIN: "دخول",
  CREATE: "إضافة",
  UPDATE: "تعديل",
  DELETE: "حذف",
  ACTIVATE: "تفعيل",
  DEACTIVATE: "تعطيل",
  UPDATE_STATUS: "تغيير حالة",
  SEND_MESSAGE: "تنبيه",
  ADD_NOTE: "ملاحظة",
  REPLY: "رد",
  UPDATE_REPLY: "تحديث رد",
  COMPLETE: "إكمال",
  UPDATE_PERMISSIONS: "صلاحيات",
};

const moduleLabels: Record<string, string> = {
  AUTH: "الدخول",
  USERS: "الحسابات",
  SERVICES: "الخدمات",
  REQUESTS: "طلبات المدينة",
  GAS: "الغاز",
  SOCIAL_SERVICES: "الخدمات الاجتماعية",
  FEEDBACK: "الشكاوى",
  MUNICIPALITIES: "البلديات",
};

function haystack(row: OperationLogRow) {
  return [
    row.action,
    actionLabels[row.action],
    row.module,
    moduleLabels[row.module],
    row.title,
    row.description,
    row.actorName,
    row.actorRole,
    row.requestNumber,
    row.citizenName,
    row.serviceName,
    row.entityType,
    row.entityId,
    row.ipAddress,
    row.metadata,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

function prettyJson(raw: string) {
  try {
    return JSON.stringify(JSON.parse(raw || "{}"), null, 2);
  } catch {
    return raw;
  }
}

export function AdminOperationLogWithSearch({
  rows,
  filterForm,
}: {
  rows: OperationLogRow[];
  filterForm: ReactNode;
}) {
  const [q, setQ] = useState("");
  const filtered = useMemo(() => {
    const n = q.trim().toLowerCase();
    if (!n) return rows;
    return rows.filter((row) => haystack(row).includes(n));
  }, [rows, q]);

  const todayCount = useMemo(() => {
    const today = new Date().toDateString();
    return rows.filter((row) => new Date(row.createdAt).toDateString() === today).length;
  }, [rows]);

  return (
    <div>
      <header className="gov-page-heading mb-6 border-b border-[var(--gov-border)] pb-4">
        <h1 className="text-lg font-bold text-[var(--gov-text)] md:text-xl">سجل العمليات</h1>
        <p className="mt-1 text-sm text-[var(--gov-muted)]">
          متابعة منظمة لكل العمليات المهمة داخل النظام مع بيانات المنفذ والطلب والتفاصيل التقنية.
        </p>
      </header>

      <div className="mb-6 grid gap-3 md:grid-cols-3">
        <div className="gov-card p-4">
          <p className="text-xs font-semibold uppercase text-[var(--gov-muted)]">المعروض</p>
          <p className="mt-1 text-2xl font-bold text-[var(--gov-text)]">{filtered.length}</p>
        </div>
        <div className="gov-card p-4">
          <p className="text-xs font-semibold uppercase text-[var(--gov-muted)]">إجمالي النتائج</p>
          <p className="mt-1 text-2xl font-bold text-[var(--gov-text)]">{rows.length}</p>
        </div>
        <div className="gov-card p-4">
          <p className="text-xs font-semibold uppercase text-[var(--gov-muted)]">عمليات اليوم</p>
          <p className="mt-1 text-2xl font-bold text-[var(--gov-text)]">{todayCount}</p>
        </div>
      </div>

      <div className="gov-card mb-6 p-4">{filterForm}</div>

      <AdminListSearchField
        id="admin-operation-log-search"
        label="بحث في سجل العمليات"
        placeholder="رقم الطلب، اسم المواطن، اسم الموظف، نوع العملية، القسم..."
        value={q}
        onChange={setQ}
        className="mb-4"
      />

      {rows.length === 0 ? (
        <p className="rounded-xl border border-[var(--gov-border)] bg-white px-4 py-3 text-center text-sm text-[var(--gov-muted)]">
          لا توجد عمليات مسجلة ضمن هذه التصفية.
        </p>
      ) : filtered.length === 0 ? (
        <p className="rounded-xl border border-[var(--gov-border)] bg-white px-4 py-3 text-center text-sm text-[var(--gov-muted)]">
          لا توجد نتائج مطابقة للبحث.
        </p>
      ) : (
        <div className="space-y-3">
          {filtered.map((row) => (
            <article key={row.id} className="gov-card p-4">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                <div className="min-w-0">
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    <Badge>{actionLabels[row.action] ?? row.action}</Badge>
                    <Badge className="border-slate-200 bg-slate-50 font-normal text-slate-700">
                      {moduleLabels[row.module] ?? row.module}
                    </Badge>
                    {row.requestNumber ? (
                      <Badge className="border-emerald-200 bg-emerald-50 font-normal text-emerald-900">
                        {row.requestNumber}
                      </Badge>
                    ) : null}
                  </div>
                  <h2 className="text-base font-bold text-[var(--gov-text)]">{row.title}</h2>
                  {row.description ? (
                    <p className="mt-1 text-sm text-[var(--gov-muted)]">{row.description}</p>
                  ) : null}
                </div>
                <div className="shrink-0 text-sm text-[var(--gov-muted)] lg:text-end">
                  <p>{new Date(row.createdAt).toLocaleString("ar")}</p>
                  <p>{row.actorName || "النظام"}</p>
                </div>
              </div>

              <dl className="mt-4 grid gap-3 border-t border-[var(--gov-border)] pt-3 text-sm md:grid-cols-4">
                <div>
                  <dt className="text-xs font-semibold text-[var(--gov-muted)]">الموظف/المستخدم</dt>
                  <dd className="mt-1 text-[var(--gov-text)]">{row.actorName || "النظام"}</dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold text-[var(--gov-muted)]">المواطن</dt>
                  <dd className="mt-1 text-[var(--gov-text)]">{row.citizenName || "-"}</dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold text-[var(--gov-muted)]">الخدمة/الطلب</dt>
                  <dd className="mt-1 text-[var(--gov-text)]">
                    {row.serviceName || row.requestNumber || row.entityType || "-"}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold text-[var(--gov-muted)]">إجراء</dt>
                  <dd className="mt-1">
                    {row.requestHref ? (
                      <Link className="font-semibold text-[var(--gov-primary)] hover:underline" href={row.requestHref}>
                        فتح الطلب
                      </Link>
                    ) : (
                      <span className="text-[var(--gov-muted)]">لا يوجد رابط طلب</span>
                    )}
                  </dd>
                </div>
              </dl>

              <details className="mt-3 rounded-lg border border-slate-200 bg-slate-50/70 px-3 py-2 text-sm">
                <summary className="cursor-pointer font-semibold text-slate-700">التفاصيل والبيانات الكاملة</summary>
                <pre className="mt-3 max-h-80 overflow-auto whitespace-pre-wrap break-words rounded-md bg-white p-3 text-xs text-slate-700">
                  {prettyJson(row.metadata)}
                </pre>
                <p className="mt-2 text-xs text-slate-500">
                  IP: {row.ipAddress || "-"} · الكيان: {row.entityType || "-"} · المعرف: {row.entityId || "-"}
                </p>
              </details>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
