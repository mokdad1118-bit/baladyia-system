"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { StatusBadge } from "@/components/ui/status-badge";
import { AdminListSearchField } from "@/components/admin/AdminListSearchField";
import { RequestStatus } from "@/generated/prisma/enums";
import { requestStatusAr } from "@/lib/labels";
import { updateInPersonRequestStatusAction } from "@/actions/admin-in-person-requests";

export type InPersonCompletedRequestRow = {
  id: string;
  requestNumber: string;
  inPersonNumber: string;
  citizenName: string;
  nationalId: string;
  phone: string;
  notificationEmail: string;
  municipalityName: string;
  serviceName: string;
  status: RequestStatus;
  createdAt: string;
  detailHref: string;
  files: {
    id: string;
    documentName: string;
    originalName: string;
    href: string;
    mimeType: string;
    size: number;
  }[];
};

function haystack(row: InPersonCompletedRequestRow) {
  return [
    row.inPersonNumber,
    row.requestNumber,
    row.citizenName,
    row.nationalId,
    row.phone,
    row.notificationEmail,
    row.municipalityName,
    row.serviceName,
    row.status,
    row.createdAt,
    ...row.files.flatMap((file) => [file.documentName, file.originalName, file.href]),
  ]
    .join(" ")
    .toLowerCase();
}

function sizeLabel(bytes: number) {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function dateLabel(iso: string) {
  return new Date(iso).toLocaleDateString("ar-SY");
}

function dateTimeLabel(iso: string) {
  return new Date(iso).toLocaleString("ar-SY");
}

const editableStatuses: RequestStatus[] = [
  RequestStatus.COMPLETED,
  RequestStatus.APPROVED,
  RequestStatus.REJECTED,
  RequestStatus.NEEDS_MODIFICATION,
];

export function AdminInPersonCompletedRequestsList({
  rows,
  successNumber,
}: {
  rows: InPersonCompletedRequestRow[];
  successNumber?: string;
}) {
  const [items, setItems] = useState(rows);
  const [q, setQ] = useState(successNumber ?? "");
  const [selected, setSelected] = useState<InPersonCompletedRequestRow | null>(null);
  useEffect(() => {
    setItems(rows);
    setSelected(null);
  }, [rows]);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return items;
    return items.filter((row) => haystack(row).includes(needle));
  }, [q, items]);

  const updateRowStatus = (requestId: string, status: RequestStatus) => {
    setItems((current) => current.map((row) => (row.id === requestId ? { ...row, status } : row)));
    setSelected((current) => (current?.id === requestId ? { ...current, status } : current));
  };

  return (
    <div className="space-y-5">
      <header className="gov-page-heading border-b border-[var(--gov-border)] pb-4">
        <h1 className="text-lg font-bold text-[var(--gov-text)] md:text-xl">الطلبات التي تم تقديمها حضورياً</h1>
        <p className="mt-1 text-sm text-[var(--gov-muted)]">
          الطلبات الحضورية التي تم إنشاؤها مع رقم حضوري خاص للبحث والمتابعة.
        </p>
      </header>

      {successNumber ? (
        <p className="rounded border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-900">
          تم إنشاء الطلب الحضوري رقم {successNumber}.
        </p>
      ) : null}

      <div className="gov-card p-4">
        <AdminListSearchField
          id="in-person-completed-search"
          label="بحث في الطلبات التي تم تقديمها حضورياً"
          placeholder="ابحث بالرقم الحضوري، رقم الطلب، اسم المواطن، الرقم الوطني، رقم الواتساب..."
          value={q}
          onChange={setQ}
          className="mb-0"
        />
      </div>

      {filtered.length === 0 ? (
        <p className="gov-card p-4 text-center text-sm text-[var(--gov-muted)]">لا توجد طلبات مطابقة.</p>
      ) : (
        <div className="gov-table-wrap">
          <table className="gov-table min-w-[52rem]">
            <thead>
              <tr>
                <th>رقم الطلب</th>
                <th>اسم المواطن</th>
                <th>البلدية</th>
                <th>تاريخ التقديم</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((row) => (
                <tr key={row.id}>
                  <td>
                    <button
                      type="button"
                      className="font-mono font-bold text-[var(--gov-primary)] underline-offset-2 hover:underline"
                      onClick={() => setSelected(row)}
                    >
                      {row.inPersonNumber}
                    </button>
                  </td>
                  <td>{row.citizenName}</td>
                  <td>{row.municipalityName}</td>
                  <td className="whitespace-nowrap text-[var(--gov-muted)]">{dateLabel(row.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {selected ? (
        <RequestDetailsDialog
          row={selected}
          onClose={() => setSelected(null)}
          onStatusChanged={updateRowStatus}
        />
      ) : null}
    </div>
  );
}

function RequestDetailsDialog({
  row,
  onClose,
  onStatusChanged,
}: {
  row: InPersonCompletedRequestRow;
  onClose: () => void;
  onStatusChanged: (requestId: string, status: RequestStatus) => void;
}) {
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<string>("");

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center overflow-y-auto bg-black/45 p-3 sm:p-5"
      role="dialog"
      aria-modal="true"
      aria-labelledby="in-person-request-dialog-title"
      onClick={onClose}
    >
      <div className="gov-card my-auto w-full max-w-5xl overflow-hidden p-0" onClick={(event) => event.stopPropagation()}>
        <header className="flex flex-wrap items-start justify-between gap-3 border-b border-[var(--gov-border)] p-4 md:p-5">
          <div>
            <p className="text-xs font-semibold text-[var(--gov-muted)]">رقم الطلب الحضوري</p>
            <h2 id="in-person-request-dialog-title" className="font-mono text-xl font-bold text-[var(--gov-primary)]">
              {row.inPersonNumber}
            </h2>
            <p className="mt-1 text-xs text-[var(--gov-muted)]">رقم الطلب الداخلي: {row.requestNumber}</p>
          </div>
          <div className="flex items-center gap-2">
            <StatusBadge status={row.status} />
            <button
              type="button"
              className="rounded-sm border border-[var(--gov-border)] bg-white px-3 py-1.5 text-sm font-semibold text-[var(--gov-text)] transition hover:bg-slate-50"
              onClick={onClose}
            >
              إغلاق
            </button>
          </div>
        </header>

        <div className="max-h-[75dvh] overflow-y-auto p-4 md:p-5">
          <section className="mb-5 rounded-sm border border-[var(--gov-border)] bg-slate-50 p-3">
            <label className="mb-1.5 block text-sm font-semibold text-[var(--gov-text)]">تغيير حالة الطلب</label>
            <div className="flex flex-wrap items-center gap-2">
              <select
                value={row.status}
                disabled={isPending}
                className="gov-input min-w-[12rem] px-3 py-2 text-sm"
                onChange={(event) => {
                  const next = event.target.value as RequestStatus;
                  setMessage("");
                  startTransition(async () => {
                    const result = await updateInPersonRequestStatusAction(row.id, next);
                    if ("error" in result) {
                      setMessage(result.error);
                      return;
                    }
                    onStatusChanged(row.id, result.status);
                    setMessage(`تم تغيير الحالة إلى ${result.statusLabel}.`);
                  });
                }}
              >
                {!editableStatuses.includes(row.status) ? (
                  <option value={row.status}>{requestStatusAr[row.status]}</option>
                ) : null}
                {editableStatuses.map((status) => (
                  <option key={status} value={status}>
                    {requestStatusAr[status]}
                  </option>
                ))}
              </select>
              {isPending ? <span className="text-xs text-[var(--gov-muted)]">جاري الحفظ...</span> : null}
              {message ? (
                <span className={`text-xs ${message.startsWith("تم") ? "text-emerald-700" : "text-rose-700"}`}>
                  {message}
                </span>
              ) : null}
            </div>
          </section>

          <section className="grid gap-3 text-sm md:grid-cols-2 xl:grid-cols-3">
            <Info label="اسم المواطن" value={row.citizenName} />
            <Info label="الرقم الوطني" value={row.nationalId || "-"} ltr />
            <Info label="رقم الواتساب" value={row.phone || "-"} ltr />
            <Info label="بريد الإشعارات" value={row.notificationEmail || "-"} ltr />
            <Info label="البلدية" value={row.municipalityName} />
            <Info label="الخدمة" value={row.serviceName} />
            <Info label="تاريخ التقديم" value={dateTimeLabel(row.createdAt)} />
          </section>

          <section className="mt-5 border-t border-[var(--gov-border)] pt-4">
            <h3 className="text-sm font-bold text-[var(--gov-text)]">المرفقات والأوراق المطلوبة</h3>
            {row.files.length === 0 ? (
              <p className="mt-2 rounded border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
                لا توجد مرفقات محفوظة لهذا الطلب.
              </p>
            ) : (
              <div className="mt-3 grid gap-2 md:grid-cols-2">
                {row.files.map((file) => (
                  <a
                    key={file.id}
                    href={file.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-sm border border-[var(--gov-border)] bg-slate-50 px-3 py-2 text-sm no-underline transition hover:bg-white"
                  >
                    <span className="block font-semibold text-[var(--gov-primary)]">{file.documentName}</span>
                    <span className="mt-1 block text-xs text-[var(--gov-muted)]">
                      {file.originalName} - {file.mimeType || "ملف"} - {sizeLabel(file.size)}
                    </span>
                  </a>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}

function Info({ label, value, ltr = false }: { label: string; value: string; ltr?: boolean }) {
  return (
    <div className="rounded-sm border border-[var(--gov-border)] bg-slate-50 px-3 py-2">
      <p className="text-xs text-[var(--gov-muted)]">{label}</p>
      <p className="mt-1 font-semibold text-[var(--gov-text)]" dir={ltr ? "ltr" : undefined}>
        {value}
      </p>
    </div>
  );
}
