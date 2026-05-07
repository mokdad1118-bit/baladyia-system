"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { StatusBadge } from "@/components/ui/status-badge";
import { ReturneeRegistrationStatusBadge } from "@/components/citizen/ReturneeRegistrationStatusBadge";

type MunicipalityRequestRow = {
  id: string;
  requestNumber: string;
  serviceName: string;
  status: "PENDING" | "UNDER_REVIEW" | "NEEDS_MODIFICATION" | "APPROVED" | "REJECTED" | "COMPLETED";
  createdAt: string;
};

type GasRequestRow = {
  id: string;
  gasRequestNumber: string;
  fullName: string;
  phone: string;
  nationalId: string;
  isCompleted: boolean;
  createdAt: string;
};

type ReturneeRequestRow = {
  id: string;
  registrationNumber: string;
  fullName: string;
  birthDate: string;
  nationalId: string;
  phone: string;
  email: string;
  status: "PENDING" | "UNDER_REVIEW" | "APPROVED" | "REJECTED";
  createdAt: string;
};

function RequestsDialog({
  title,
  open,
  onClose,
  children,
}: {
  title: string;
  open: boolean;
  onClose: () => void;
  children: ReactNode;
}) {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/40 p-2 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-label={title}
      onClick={onClose}
    >
      <div className="gov-card my-auto w-full max-w-5xl overflow-hidden rounded-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-[var(--gov-border)] px-4 py-3">
          <h2 className="text-base font-bold text-[var(--gov-text)] md:text-lg">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex min-h-10 items-center rounded-lg border border-[var(--gov-border)] px-3 text-sm font-semibold text-[var(--gov-text)] hover:bg-[#f3f5f7]"
          >
            إغلاق
          </button>
        </div>
        <div className="max-h-[min(78dvh,calc(100vh-120px))] overflow-auto p-4">{children}</div>
      </div>
    </div>
  );
}

export function CitizenRequestsView({
  requestsBasePath,
  municipalityRequests,
  gasRequests,
  returneeRegistrations,
}: {
  requestsBasePath: string;
  municipalityRequests: MunicipalityRequestRow[];
  gasRequests: GasRequestRow[];
  returneeRegistrations: ReturneeRequestRow[];
}) {
  const [openSection, setOpenSection] = useState<"municipal" | "gas" | "returnee" | null>(null);

  useEffect(() => {
    const hash = window.location.hash;
    if (hash === "#citizen-gas-requests") setOpenSection("gas");
    if (hash === "#citizen-returnee-requests") setOpenSection("returnee");
  }, []);

  const currentTitle =
    openSection === "municipal"
      ? "طلباتك المخصصة لخدمات البلدية"
      : openSection === "gas"
        ? "طلباتك المخصصة لخدمات الغاز"
        : openSection === "returnee"
          ? "طلبات تسجيل العائدين"
          : "";

  const currentBody = useMemo(() => {
    if (openSection === "municipal") {
      if (municipalityRequests.length === 0) {
        return (
          <div className="rounded-xl border border-dashed border-[var(--gov-border)] p-8 text-center text-sm text-[var(--gov-muted)]">
            لا توجد طلبات بلدية بعد.
          </div>
        );
      }
      return (
        <>
          <ul className="space-y-2 md:hidden">
            {municipalityRequests.map((r) => (
              <li key={r.id}>
                <Link
                  href={`${requestsBasePath}/${r.id}`}
                  className="gov-card flex flex-col gap-2 p-4 text-sm no-underline transition-colors hover:bg-[#f7f8fa] active:bg-[#eef6f1]"
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <span className="font-mono font-semibold text-[var(--gov-primary)]">{r.requestNumber}</span>
                    <StatusBadge status={r.status} />
                  </div>
                  <p className="break-words text-[var(--gov-text)]">{r.serviceName}</p>
                  <time className="text-xs text-[var(--gov-muted)]" dateTime={r.createdAt}>
                    {new Date(r.createdAt).toLocaleDateString("ar")}
                  </time>
                </Link>
              </li>
            ))}
          </ul>
          <div className="gov-table-wrap hidden md:block">
            <table className="gov-table">
              <thead>
                <tr>
                  <th>الرقم</th>
                  <th>الخدمة</th>
                  <th>الحالة</th>
                  <th>التاريخ</th>
                </tr>
              </thead>
              <tbody>
                {municipalityRequests.map((r) => (
                  <tr key={r.id}>
                    <td>
                      <Link
                        href={`${requestsBasePath}/${r.id}`}
                        className="font-mono font-semibold text-[var(--gov-primary)] hover:underline"
                      >
                        {r.requestNumber}
                      </Link>
                    </td>
                    <td>{r.serviceName}</td>
                    <td>
                      <StatusBadge status={r.status} />
                    </td>
                    <td className="whitespace-nowrap text-[var(--gov-muted)]">{new Date(r.createdAt).toLocaleDateString("ar")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      );
    }

    if (openSection === "gas") {
      if (gasRequests.length === 0) {
        return (
          <div className="rounded-xl border border-dashed border-[var(--gov-border)] p-8 text-center text-sm text-[var(--gov-muted)]">
            لا توجد طلبات غاز بعد.
          </div>
        );
      }
      return (
        <div className="gov-table-wrap">
          <table className="gov-table">
            <thead>
              <tr>
                <th>رقم طلب الغاز</th>
                <th>الاسم الثلاثي</th>
                <th>رقم الهاتف</th>
                <th>الرقم الوطني</th>
                <th>الحالة</th>
                <th>التاريخ</th>
              </tr>
            </thead>
            <tbody>
              {gasRequests.map((g) => (
                <tr key={g.id}>
                  <td className="font-mono font-semibold text-[var(--gov-primary)]">{g.gasRequestNumber}</td>
                  <td>{g.fullName}</td>
                  <td dir="ltr">{g.phone}</td>
                  <td dir="ltr">{g.nationalId}</td>
                  <td>
                    {g.isCompleted ? (
                      <span className="rounded-full bg-emerald-100 px-2 py-1 text-xs font-semibold text-emerald-800">تم التسليم</span>
                    ) : (
                      <span className="rounded-full bg-amber-100 px-2 py-1 text-xs font-semibold text-amber-800">قيد المتابعة</span>
                    )}
                  </td>
                  <td className="whitespace-nowrap text-[var(--gov-muted)]">{new Date(g.createdAt).toLocaleDateString("ar")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }

    if (openSection === "returnee") {
      if (returneeRegistrations.length === 0) {
        return (
          <div className="rounded-xl border border-dashed border-[var(--gov-border)] p-8 text-center text-sm text-[var(--gov-muted)]">
            لا توجد طلبات تسجيل عائدين بعد.
          </div>
        );
      }
      return (
        <div className="gov-table-wrap">
          <table className="gov-table">
            <thead>
              <tr>
                <th>رقم الطلب</th>
                <th>الاسم الثلاثي</th>
                <th>تاريخ الميلاد</th>
                <th>الرقم الوطني</th>
                <th>الهاتف</th>
                <th>البريد</th>
                <th>الحالة</th>
                <th>تاريخ التقديم</th>
              </tr>
            </thead>
            <tbody>
              {returneeRegistrations.map((r) => (
                <tr key={r.id}>
                  <td className="font-mono font-semibold text-[var(--gov-primary)]">{r.registrationNumber}</td>
                  <td>{r.fullName}</td>
                  <td className="whitespace-nowrap">{new Date(r.birthDate).toLocaleDateString("ar")}</td>
                  <td dir="ltr">{r.nationalId}</td>
                  <td dir="ltr">{r.phone}</td>
                  <td dir="ltr" className="max-w-[10rem] break-all text-sm">
                    {r.email}
                  </td>
                  <td>
                    <ReturneeRegistrationStatusBadge status={r.status} />
                  </td>
                  <td className="whitespace-nowrap text-[var(--gov-muted)]">{new Date(r.createdAt).toLocaleDateString("ar")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }

    return null;
  }, [openSection, municipalityRequests, gasRequests, returneeRegistrations, requestsBasePath]);

  const total =
    municipalityRequests.length + gasRequests.length + returneeRegistrations.length;

  return (
    <section className="space-y-4">
      <div className="gov-card space-y-3 p-4">
        <p className="text-sm text-[var(--gov-muted)]">اختر القسم المطلوب لعرض طلباتك داخل نافذة منبثقة. إجمالي الطلبات: {total}.</p>
        <div className="grid gap-2 sm:grid-cols-3">
          <button
            type="button"
            onClick={() => setOpenSection("municipal")}
            className="inline-flex min-h-11 items-center justify-center rounded-lg border border-[var(--gov-border)] bg-white px-3 text-sm font-semibold text-[var(--gov-text)] hover:bg-[#f3f5f7]"
          >
            اضغط لعرض طلبات البلدية ({municipalityRequests.length})
          </button>
          <button
            type="button"
            onClick={() => setOpenSection("gas")}
            className="inline-flex min-h-11 items-center justify-center rounded-lg border border-[var(--gov-border)] bg-white px-3 text-sm font-semibold text-[var(--gov-primary)] hover:bg-[#f3f5f7]"
          >
            اضغط لعرض طلبات الغاز ({gasRequests.length})
          </button>
          <button
            type="button"
            onClick={() => setOpenSection("returnee")}
            className="inline-flex min-h-11 items-center justify-center rounded-lg border border-[var(--gov-border)] bg-white px-3 text-sm font-semibold text-[var(--gov-primary)] hover:bg-[#f3f5f7]"
          >
            اضغط لعرض طلبات العائدين ({returneeRegistrations.length})
          </button>
        </div>
      </div>

      <RequestsDialog title={currentTitle} open={openSection !== null} onClose={() => setOpenSection(null)}>
        {currentBody}
      </RequestsDialog>
    </section>
  );
}
