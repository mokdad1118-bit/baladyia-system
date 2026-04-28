import { db } from "@/lib/db";
import { requestStatusAr } from "@/lib/labels";
import { RequestStatus } from "@/generated/prisma/enums";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { auth } from "@/auth";
import { requireAdminRole } from "@/lib/admin-guard";

export default async function AdminStatsPage() {
  await requireAdminRole(await auth());
  const [total, byService, byStatus, completed] = await Promise.all([
    db.request.count(),
    db.service.findMany({
      where: { isActive: true },
      include: { _count: { select: { requests: true } } },
    }),
    Promise.all(
      (Object.values(RequestStatus) as RequestStatus[]).map(async (st) => {
        const c = await db.request.count({ where: { status: st } });
        return [st, c] as const;
      }),
    ),
    db.request.count({ where: { status: RequestStatus.COMPLETED } }),
  ]);
  return (
    <div>
      <PageHeader title="الإحصائيات" />
      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardContent className="!pt-6">
            <p className="text-sm font-medium text-slate-500">إجمالي الطلبات</p>
            <p className="mt-1 text-3xl font-bold tabular-nums text-slate-900">{total}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="!pt-6">
            <p className="text-sm font-medium text-slate-500">مكتمل</p>
            <p className="mt-1 text-3xl font-bold tabular-nums text-emerald-900">{completed}</p>
          </CardContent>
        </Card>
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardContent className="!pt-6">
            <h2 className="text-sm font-semibold text-slate-900">حسب الحالة</h2>
            <ul className="mt-3 space-y-2 text-sm text-slate-600">
              {byStatus.map(([st, c]) => (
                <li key={st} className="flex justify-between gap-2">
                  <span>{requestStatusAr[st]}</span>
                  <span className="font-mono font-medium tabular-nums text-slate-900">{c}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="!pt-6">
            <h2 className="text-sm font-semibold text-slate-900">حسب الخدمة</h2>
            <ul className="mt-3 space-y-2 text-sm text-slate-600">
              {byService.map((s) => (
                <li key={s.id} className="flex justify-between gap-2">
                  <span className="truncate">{s.name}</span>
                  <span className="shrink-0 font-mono tabular-nums text-slate-900">
                    {s._count.requests}
                  </span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
