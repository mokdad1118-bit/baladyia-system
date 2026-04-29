import { db } from "@/lib/db";
import { RequestStatus } from "@/generated/prisma/enums";
import { auth } from "@/auth";
import { requireStaffPanelPermission } from "@/lib/admin-guard";
import { StatsListsWithSearch } from "@/components/admin/StatsListsWithSearch";

export default async function AdminStatsPage() {
  await requireStaffPanelPermission(await auth(), "stats");
  const [total, byService, byStatus, completed] = await Promise.all([
    db.request.count(),
    db.service.findMany({
      where: { isActive: true },
      include: { _count: { select: { requests: true } } },
    }),
    Promise.all(
      (Object.values(RequestStatus) as RequestStatus[]).map(async (st) => {
        const c = await db.request.count({ where: { status: st } });
        return { status: st, count: c };
      }),
    ),
    db.request.count({ where: { status: RequestStatus.COMPLETED } }),
  ]);

  return (
    <StatsListsWithSearch
      total={total}
      completed={completed}
      byStatus={byStatus}
      byService={byService.map((s) => ({
        id: s.id,
        name: s.name,
        count: s._count.requests,
      }))}
    />
  );
}
