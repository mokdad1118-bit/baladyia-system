import { db } from "@/lib/db";
import { RequestStatus } from "@/generated/prisma/enums";
import { auth } from "@/auth";
import { requireStaffPanelPermission } from "@/lib/admin-guard";
import { StatsListsWithSearch } from "@/components/admin/StatsListsWithSearch";
import { staffMunicipalityIdFilter } from "@/lib/municipality-scope";
import { listActiveMunicipalities } from "@/lib/municipalities";
import { isSuperAdminRole } from "@/lib/roles";
import { AdminPageMunicipalityScopeForm } from "@/components/admin/AdminPageMunicipalityScopeForm";

type Props = { searchParams: Promise<{ municipalityId?: string }> };

export default async function AdminStatsPage({ searchParams }: Props) {
  const s = await auth();
  await requireStaffPanelPermission(s, "stats");
  const sp = await searchParams;
  const isSuperAdmin = s?.user ? isSuperAdminRole(s.user.role) : false;
  const selectedMunicipalityId =
    isSuperAdmin && sp.municipalityId && sp.municipalityId !== "__ALL__" ? sp.municipalityId : "";
  const mun = isSuperAdmin
    ? selectedMunicipalityId
      ? { municipalityId: selectedMunicipalityId }
      : {}
    : staffMunicipalityIdFilter(s);
  const requestWhere = { ...mun };
  const serviceWhere = { ...mun };
  const [municipalities, total, byService, byStatus, completed, gasRequestsCount, socialRequestsCount] = await Promise.all([
    isSuperAdmin ? listActiveMunicipalities() : Promise.resolve([]),
    db.request.count({ where: requestWhere }),
    db.service.findMany({
      where: serviceWhere,
      orderBy: [{ municipality: { sortOrder: "asc" } }, { name: "asc" }],
      include: {
        municipality: { select: { name: true } },
        _count: { select: { requests: true } },
      },
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
    <>
      <AdminPageMunicipalityScopeForm municipalities={municipalities} current={selectedMunicipalityId} />
      <StatsListsWithSearch
        total={total}
        completed={completed}
        gasRequestsCount={gasRequestsCount}
        socialRequestsCount={socialRequestsCount}
        byStatus={byStatus}
        byService={byService.map((s) => ({
          id: s.id,
          name: s.name,
          municipalityName: s.municipality.name,
          isActive: s.isActive,
          count: s._count.requests,
        }))}
      />
    </>
  );
}
