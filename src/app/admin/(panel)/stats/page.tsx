import { db } from "@/lib/db";
import { RequestStatus } from "@/generated/prisma/enums";
import { auth } from "@/auth";
import { requireStaffPanelPermission } from "@/lib/admin-guard";
import { StatsListsWithSearch } from "@/components/admin/StatsListsWithSearch";
import { staffMunicipalityIdFilter } from "@/lib/municipality-scope";

export default async function AdminStatsPage() {
  const s = await auth();
  await requireStaffPanelPermission(s, "stats");
  const mun = staffMunicipalityIdFilter(s);
  const requestWhere = { ...mun };
  const serviceWhere = { isActive: true, ...mun };
  const [total, byService, byStatus, completed, gasRequestsCount, socialRequestsCount] = await Promise.all([
    db.request.count({ where: requestWhere }),
    db.service.findMany({
      where: serviceWhere,
      include: { _count: { select: { requests: true } } },
    }),
    Promise.all(
      (Object.values(RequestStatus) as RequestStatus[]).map(async (st) => {
        const c = await db.request.count({ where: { ...requestWhere, status: st } });
        return { status: st, count: c };
      }),
    ),
    db.request.count({ where: { ...requestWhere, status: RequestStatus.COMPLETED } }),
    db.gasRequest.count({ where: mun }),
    db.socialServiceCase.count({ where: mun }),
  ]);

  return (
    <StatsListsWithSearch
      total={total}
      completed={completed}
      gasRequestsCount={gasRequestsCount}
      socialRequestsCount={socialRequestsCount}
      byStatus={byStatus}
      byService={byService.map((s) => ({
        id: s.id,
        name: s.name,
        count: s._count.requests,
      }))}
    />
  );
}
