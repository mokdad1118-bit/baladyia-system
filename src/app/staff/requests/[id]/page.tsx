import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { requestStatusAr } from "@/lib/labels";
import { RequestStatus } from "@/generated/prisma/enums";
import { updateRequestStatus, addRequestNote } from "@/actions/request-staff";
import Link from "next/link";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { FieldGroup, Textarea, FieldLabel } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

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

export default async function StaffRequestDetailPage({ params, searchParams }: P) {
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
          className="mb-4 rounded-lg border border-red-200 bg-red-50/90 px-3 py-2 text-sm text-slate-800"
        >
          تعذّر حفظ تغيير الحالة. أعد المحاولة؛ إذا استمر الخطأ راجع سجلات الخادم أو اتصال قاعدة البيانات.
        </p>
      )}
      <PageHeader
        title={r.requestNumber}
        description={`${r.service.name} — ${r.citizen.name}`}
        actions={<StatusBadge status={r.status} />}
      />
      <div className="mb-4 flex flex-wrap items-center gap-2 text-sm text-slate-600">
        <span>
          مُرسل مع الطلب: {r.submittedFullName || r.citizen.name} — واتساب:{" "}
          <span dir="ltr" className="font-mono">
            {r.submittedPhone || r.citizen.phone || "—"}
          </span>
        </span>
        {(r.submittedNotificationEmail || r.citizen.notificationEmail) && (
          <a
            className="hover:text-teal-700"
            href={`mailto:${r.submittedNotificationEmail || r.citizen.notificationEmail}`}
          >
            {r.submittedNotificationEmail || r.citizen.notificationEmail}
          </a>
        )}
        {r.citizen.email && (
          <a className="hover:text-teal-700" href={`mailto:${r.citizen.email}`}>
            {r.citizen.email}
          </a>
        )}
        {r.assignee && <Badge>مسؤول: {r.assignee.name}</Badge>}
      </div>

      <div className="space-y-5 max-w-3xl">
        <Card>
          <CardHeader>
            <CardTitle>تغيير حالة الطلب</CardTitle>
          </CardHeader>
          <CardContent>
            <form action={updateRequestStatus} className="space-y-4 max-w-md">
              <input type="hidden" name="requestId" value={r.id} />
              <input type="hidden" name="actorPortal" value="staff" />
              <input type="hidden" name="listPath" value="/staff/requests" />
              <FieldGroup>
                <FieldLabel>الحالة الجديدة</FieldLabel>
                <select
                  className="w-full rounded-xl border border-slate-200/90 bg-white px-3 py-2.5 text-sm focus:border-teal-500/50 focus:ring-2 focus:ring-teal-500/20"
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
                <Textarea
                  name="noteForCitizen"
                  rows={2}
                  placeholder="مثال: يرجى رفع وثيقة أوضح…"
                />
              </FieldGroup>
              <Button type="submit">تطبيق الحالة</Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>ملاحظة داخلية</CardTitle>
          </CardHeader>
          <CardContent>
            <form action={addRequestNote} className="space-y-3 max-w-md">
              <input type="hidden" name="requestId" value={r.id} />
              <input type="hidden" name="actorPortal" value="staff" />
              <input type="hidden" name="detailPath" value={`/staff/requests/${r.id}`} />
              <Textarea
                name="body"
                required
                rows={3}
                placeholder="مرئية لموظفي النظام فقط"
              />
              <Button variant="secondary" type="submit">
                حفظ الملاحظة
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>سجل التحديثات</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-slate-700">
              {r.statusLogs.map((l) => (
                <li
                  key={l.id}
                  className="border-b border-slate-100/90 pb-2 last:border-0"
                >
                  <span className="text-xs text-slate-500">
                    {l.createdAt.toLocaleString("ar")}
                  </span>{" "}
                  {l.actor.name} → {requestStatusAr[l.toStatus]}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>ملاحظات فريق العمل</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3 text-sm">
              {r.notes.length === 0 && (
                <p className="text-slate-500">لا ملاحظات بعد</p>
              )}
              {r.notes.map((n) => (
                <li
                  key={n.id}
                  className="rounded-xl border-s-2 border-amber-200/60 bg-amber-50/40 px-3 py-2"
                >
                  <p className="text-xs text-slate-500">
                    {n.author.name} · {n.createdAt.toLocaleString("ar")}
                  </p>
                  <p className="text-slate-800">{n.body}</p>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>المرفقات</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              {r.files.map((f) => (
                <li key={f.id} className="flex flex-wrap items-baseline justify-between gap-2">
                  <span className="text-slate-600">{f.serviceDocument.name}</span>
                  <a
                    className="font-medium text-teal-700 hover:underline"
                    href={`/api/request-files/${f.id}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {f.originalName}
                  </a>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Link
          className="inline-flex text-sm text-slate-500 hover:text-teal-700"
          href="/staff/requests"
        >
          ← القائمة
        </Link>
      </div>
    </div>
  );
}
