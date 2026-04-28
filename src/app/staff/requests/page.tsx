import Link from "next/link";
import { db } from "@/lib/db";
import { requestStatusAr } from "@/lib/labels";
import { RequestStatus } from "@/generated/prisma/enums";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { FieldGroup } from "@/components/ui/field";

type S = { searchParams: Promise<{ status?: string }> };

export default async function StaffRequestsPage({ searchParams }: S) {
  const sp = await searchParams;
  const st = sp.status;
  const where = st && Object.values(RequestStatus).includes(st as RequestStatus)
    ? { status: st as RequestStatus }
    : {};
  const list = await db.request.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 150,
    include: { service: true, citizen: true, assignee: true },
  });
  return (
    <div>
      <PageHeader
        title="الطلبات"
        description="فلترة سريعة حسب الحالة ثم فتح التفاصيل."
      />
      <Card className="mb-6">
        <CardContent className="!py-4">
          <form className="flex flex-wrap items-end gap-3" method="get" action="/staff/requests">
            <FieldGroup className="!min-w-[10rem] flex-1 sm:max-w-xs">
              <label className="mb-1.5 block text-sm font-medium text-slate-700">الحالة</label>
              <select
                className="w-full rounded-xl border border-slate-200/90 bg-white px-3 py-2.5 text-sm shadow-sm"
                name="status"
                defaultValue={st ?? ""}
              >
                <option value="">الكل</option>
                {(Object.keys(requestStatusAr) as RequestStatus[]).map((k) => (
                  <option key={k} value={k}>
                    {requestStatusAr[k]}
                  </option>
                ))}
              </select>
            </FieldGroup>
            <button
              className="inline-flex h-10 items-center justify-center rounded-xl bg-teal-600 px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-700"
              type="submit"
            >
              تطبيق
            </button>
          </form>
        </CardContent>
      </Card>
      <ul className="space-y-2">
        {list.length === 0 && (
          <p className="text-center text-slate-500">لا طلبات مطابقة</p>
        )}
        {list.map((r) => (
          <li key={r.id}>
            <Link href={`/staff/requests/${r.id}`}>
              <Card className="transition hover:ring-1 hover:ring-teal-500/20">
                <CardContent className="!py-3">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                      <p className="font-mono text-sm font-bold text-slate-900">{r.requestNumber}</p>
                      <p className="truncate text-sm text-slate-600">{r.service.name}</p>
                      <p className="text-xs text-slate-500">{r.citizen.name}</p>
                    </div>
                    <StatusBadge status={r.status} />
                  </div>
                </CardContent>
              </Card>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
