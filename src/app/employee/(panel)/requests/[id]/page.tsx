import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { requestStatusAr } from "@/lib/labels";
import { RequestStatus } from "@/generated/prisma/enums";
import { updateRequestStatus, addRequestNote } from "@/actions/request-staff";
import Link from "next/link";
import { StatusBadge } from "@/components/ui/status-badge";
import { FieldGroup, Textarea, FieldLabel } from "@/components/ui/field";
import { Button } from "@/components/ui/button";

type P = {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

const statuses: RequestStatus[] = [
  RequestStatus.PENDING,
  RequestStatus.UNDER_REVIEW,
  RequestStatus.NEEDS_MODIFICATION,
  RequestStatus.APPROVED,
  RequestStatus.REJECTED,
  RequestStatus.COMPLETED,
];

export default async function EmployeeRequestDetailPage({ params, searchParams }: P) {
  const { id } = await params;
  const sp = await searchParams;
  const statusError = sp.statusError === "1";
  const r = await db.request.findFirst({
    where: { id },
    include: {
      service: true,
      citizen: true,
      assignee: true,
      statusLogs: { orderBy: { createdAt: "asc" }, include: { actor: true } },
      notes: { orderBy: { createdAt: "asc" }, include: { author: true } },
      files: { include: { serviceDocument: true } },
    },
  });
  if (!r) notFound();

  return (
    <div>
      {statusError && (
        <p
          role="alert"
          className="mb-4 border border-[var(--gov-flag-red)]/35 bg-[var(--gov-flag-red)]/5 px-3 py-2 text-sm text-[var(--gov-text)]"
        >
          تعذّر حفظ تغيير الحالة. أعد المحاولة؛ إذا استمر الخطأ راجع سجلات الخادم أو اتصال قاعدة البيانات.
        </p>
      )}
      <div className="mb-4 flex flex-wrap items-start justify-between gap-2 border-b border-[var(--gov-border)] pb-4">
        <div>
          <h1 className="font-mono text-lg font-bold text-[var(--gov-text)]">{r.requestNumber}</h1>
          <p className="text-sm text-[var(--gov-muted)]">
            {r.service.name} — {r.citizen.name}
          </p>
        </div>
        <StatusBadge status={r.status} />
      </div>
      <p className="mb-4 text-sm text-[var(--gov-muted)]">
        واتساب:{" "}
        <span dir="ltr" className="font-mono">
          {r.submittedPhone || r.citizen.phone || "—"}
        </span>
        {r.assignee && (
          <span className="ms-3 text-[var(--gov-text)]">مسؤول: {r.assignee.name}</span>
        )}
      </p>

      <div className="max-w-3xl space-y-5">
        <div className="gov-card p-4">
          <h2 className="mb-3 border-b border-[var(--gov-border)] pb-2 text-sm font-bold">تغيير حالة الطلب</h2>
          <form action={updateRequestStatus} className="max-w-md space-y-4">
            <input type="hidden" name="requestId" value={r.id} />
            <input type="hidden" name="actorPortal" value="employee" />
            <input type="hidden" name="listPath" value="/employee/requests" />
            <FieldGroup>
              <FieldLabel>الحالة الجديدة</FieldLabel>
              <select
                className="gov-input w-full px-3 py-2.5 text-sm"
                name="toStatus"
                required
                defaultValue={r.status}
              >
                {statuses.map((k) => (
                  <option key={k} value={k}>
                    {requestStatusAr[k]}
                  </option>
                ))}
              </select>
            </FieldGroup>
            <FieldGroup>
              <FieldLabel>تنبيه للمواطن (اختياري)</FieldLabel>
              <Textarea name="noteForCitizen" rows={2} placeholder="يظهر في سجل الطلب للمواطن" />
            </FieldGroup>
            <Button type="submit" className="gov-btn-primary rounded-sm border-0 bg-[var(--gov-primary)]">
              تطبيق الحالة
            </Button>
          </form>
        </div>

        <div className="gov-card p-4">
          <h2 className="mb-3 border-b border-[var(--gov-border)] pb-2 text-sm font-bold">ملاحظة داخلية</h2>
          <form action={addRequestNote} className="max-w-md space-y-3">
            <input type="hidden" name="requestId" value={r.id} />
            <input type="hidden" name="actorPortal" value="employee" />
            <input type="hidden" name="listPath" value="/employee/requests" />
            <input type="hidden" name="detailPath" value={`/employee/requests/${r.id}`} />
            <Textarea name="body" required rows={3} placeholder="للموظفين فقط" />
            <Button type="submit" variant="secondary">
              حفظ الملاحظة
            </Button>
          </form>
        </div>

        <div className="gov-card p-4">
          <h2 className="mb-3 text-sm font-bold">سجل التحديثات</h2>
          <ul className="space-y-2 text-sm text-[var(--gov-text)]">
            {r.statusLogs.map((l) => (
              <li key={l.id} className="border-b border-[var(--gov-border)]/70 pb-2 last:border-0">
                <span className="text-xs text-[var(--gov-muted)]">{l.createdAt.toLocaleString("ar")}</span>{" "}
                {l.actor.name} → {requestStatusAr[l.toStatus]}
              </li>
            ))}
          </ul>
        </div>

        <div className="gov-card p-4">
          <h2 className="mb-3 text-sm font-bold">ملاحظات فريق العمل</h2>
          <ul className="space-y-2 text-sm">
            {r.notes.length === 0 && <p className="text-[var(--gov-muted)]">لا ملاحظات</p>}
            {r.notes.map((n) => (
              <li key={n.id} className="border-s-2 border-[var(--gov-border)] bg-[#f7f8fa] px-3 py-2">
                <p className="text-xs text-[var(--gov-muted)]">
                  {n.author.name} · {n.createdAt.toLocaleString("ar")}
                </p>
                <p>{n.body}</p>
              </li>
            ))}
          </ul>
        </div>

        <div className="gov-card p-4">
          <h2 className="mb-3 text-sm font-bold">المرفقات</h2>
          <ul className="space-y-2 text-sm">
            {r.files.map((f) => (
              <li key={f.id} className="flex flex-wrap justify-between gap-2">
                <span className="text-[var(--gov-muted)]">{f.serviceDocument.name}</span>
                <a
                  className="font-medium text-[var(--gov-primary)] hover:underline"
                  href={`/api/request-files/${f.id}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  {f.originalName}
                </a>
              </li>
            ))}
          </ul>
        </div>

        <Link href="/employee/requests" className="text-sm text-[var(--gov-primary)] hover:underline">
          ← القائمة
        </Link>
      </div>
    </div>
  );
}
