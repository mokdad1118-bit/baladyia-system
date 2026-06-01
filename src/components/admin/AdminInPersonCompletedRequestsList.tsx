"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { StatusBadge } from "@/components/ui/status-badge";
import { AdminListSearchField } from "@/components/admin/AdminListSearchField";

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
  status: "PENDING" | "UNDER_REVIEW" | "NEEDS_MODIFICATION" | "APPROVED" | "REJECTED" | "COMPLETED";
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

export function AdminInPersonCompletedRequestsList({
  rows,
  successNumber,
}: {
  rows: InPersonCompletedRequestRow[];
  successNumber?: string;
}) {
  const [q, setQ] = useState(successNumber ?? "");
  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return rows;
    return rows.filter((row) => haystack(row).includes(needle));
  }, [q, rows]);

  return (
    <div className="space-y-5">
      <header className="gov-page-heading border-b border-[var(--gov-border)] pb-4">
        <h1 className="text-lg font-bold text-[var(--gov-text)] md:text-xl">الطلبات المنتهية</h1>
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
          label="بحث في الطلبات المنتهية"
          placeholder="ابحث بالرقم الحضوري، رقم الطلب، اسم المواطن، الرقم الوطني، رقم الواتساب..."
          value={q}
          onChange={setQ}
          className="mb-0"
        />
      </div>

      {filtered.length === 0 ? (
        <p className="gov-card p-4 text-center text-sm text-[var(--gov-muted)]">لا توجد طلبات مطابقة.</p>
      ) : (
        <div className="space-y-4">
          {filtered.map((row) => (
            <article key={row.id} className="gov-card p-4 md:p-5">
              <div className="flex flex-wrap items-start justify-between gap-3 border-b border-[var(--gov-border)] pb-3">
                <div>
                  <p className="text-xs font-semibold text-[var(--gov-muted)]">الرقم الحضوري</p>
                  <Link href={row.detailHref} className="font-mono text-lg font-bold text-[var(--gov-primary)] hover:underline">
                    {row.inPersonNumber}
                  </Link>
                  <p className="mt-1 text-xs text-[var(--gov-muted)]">رقم الطلب الداخلي: {row.requestNumber}</p>
                </div>
                <StatusBadge status={row.status} />
              </div>

              <div className="mt-4 grid gap-3 text-sm md:grid-cols-2 xl:grid-cols-3">
                <Info label="اسم المواطن" value={row.citizenName} />
                <Info label="الرقم الوطني" value={row.nationalId || "-"} ltr />
                <Info label="رقم الواتساب" value={row.phone || "-"} ltr />
                <Info label="بريد الإشعارات" value={row.notificationEmail || "-"} ltr />
                <Info label="البلدية" value={row.municipalityName} />
                <Info label="الخدمة" value={row.serviceName} />
                <Info label="تاريخ الإنشاء" value={new Date(row.createdAt).toLocaleString("ar-SY")} />
              </div>

              <section className="mt-4 border-t border-[var(--gov-border)] pt-3">
                <h2 className="text-sm font-bold text-[var(--gov-text)]">المرفقات والأوراق المطلوبة</h2>
                {row.files.length === 0 ? (
                  <p className="mt-2 rounded border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
                    لا توجد مرفقات محفوظة لهذا الطلب.
                  </p>
                ) : (
                  <div className="mt-2 grid gap-2 md:grid-cols-2">
                    {row.files.map((file) => (
                      <a
                        key={file.id}
                        href={file.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="rounded border border-[var(--gov-border)] bg-slate-50 px-3 py-2 text-sm no-underline hover:bg-white"
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
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

function Info({ label, value, ltr = false }: { label: string; value: string; ltr?: boolean }) {
  return (
    <div className="rounded border border-[var(--gov-border)] bg-slate-50 px-3 py-2">
      <p className="text-xs text-[var(--gov-muted)]">{label}</p>
      <p className="mt-1 font-semibold text-[var(--gov-text)]" dir={ltr ? "ltr" : undefined}>
        {value}
      </p>
    </div>
  );
}
