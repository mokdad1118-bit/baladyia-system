import { auth } from "@/auth";
import { db } from "@/lib/db";
import { ADMIN_NAV_BADGE_NOTIFICATION_TYPES } from "@/lib/admin-nav-badges";
import { parseDateEndParam, parseDateStartParam } from "@/lib/request-list-filters";
import { AdminGasRequestsTableWithSearch } from "@/components/admin/AdminGasRequestsTableWithSearch";
import { GasAgentCreateForm } from "@/components/admin/GasAgentCreateForm";
import { GasAgentBarcodeDialog } from "@/components/admin/GasAgentBarcodeDialog";
import { GasAgentEditDialog } from "@/components/admin/GasAgentEditDialog";
import { GasAgentToggleButton } from "@/components/admin/GasAgentToggleButton";
import { UserRole } from "@/generated/prisma/enums";
import type { Prisma } from "@/generated/prisma/client";
import { staffGasAgentUserWhere, staffMunicipalityIdFilter } from "@/lib/municipality-scope";
import { isSuperAdminRole } from "@/lib/roles";
import { listActiveMunicipalities } from "@/lib/municipalities";
import { requireStaffPanelPermission } from "@/lib/admin-guard";
import { AdminPageMunicipalityScopeForm } from "@/components/admin/AdminPageMunicipalityScopeForm";

type S = { searchParams: Promise<{ dateFrom?: string; dateTo?: string; municipalityId?: string }> };
type GasRequestWithAgent = Prisma.GasRequestGetPayload<{
  include: {
    assignedAgent: { select: { name: true } };
    municipality: { select: { name: true } };
  };
}>;

export default async function AdminGasServicesPage({ searchParams }: S) {
  const session = await auth();
  await requireStaffPanelPermission(session, "gas");
  const sp = await searchParams;
  const isSuperAdmin = session?.user ? isSuperAdminRole(session.user.role) : false;
  const selectedMunicipalityId =
    isSuperAdmin && sp.municipalityId && sp.municipalityId !== "__ALL__" ? sp.municipalityId : "";
  const mun = isSuperAdmin ? (selectedMunicipalityId ? { municipalityId: selectedMunicipalityId } : {}) : staffMunicipalityIdFilter(session);
  const gasAgentWhere: Prisma.UserWhereInput = isSuperAdmin
    ? { role: UserRole.GAS_AGENT, ...(selectedMunicipalityId ? { municipalityId: selectedMunicipalityId } : {}) }
    : staffGasAgentUserWhere(session);
  if (session?.user) {
    try {
      await db.notification.updateMany({
        where: {
          userId: session.user.id,
          read: false,
          type: { in: [...ADMIN_NAV_BADGE_NOTIFICATION_TYPES.gas] },
        },
        data: { read: true },
      });
    } catch (e) {
      console.error("[admin/gas-services] mark notifications read failed", e);
    }
  }

  const d0 = parseDateStartParam(sp.dateFrom);
  const d1 = parseDateEndParam(sp.dateTo);

  const dateFilter =
    d0 || d1 ? { createdAt: { ...(d0 ? { gte: d0 } : {}), ...(d1 ? { lte: d1 } : {}) } } : {};
  let list: GasRequestWithAgent[] = [];
  let municipalities: { id: string; name: string; code: string }[] = [];
  let agents: {
    id: string;
    name: string;
    phone: string | null;
    gasArea: string | null;
    isActive: boolean;
    municipality: { name: string } | null;
  }[] = [];
  let loadError = false;

  try {
    [list, municipalities, agents] = await Promise.all([
      db.gasRequest.findMany({
        where: { ...mun, ...dateFilter },
        orderBy: { createdAt: "desc" },
        take: 500,
        include: {
          assignedAgent: { select: { name: true } },
          municipality: { select: { name: true } },
        },
      }),
      isSuperAdmin ? listActiveMunicipalities() : Promise.resolve([]),
      db.user.findMany({
        where: gasAgentWhere,
        orderBy: [{ gasArea: "asc" }, { createdAt: "asc" }],
        select: {
          id: true,
          name: true,
          phone: true,
          gasArea: true,
          isActive: true,
          municipality: { select: { name: true } },
        },
      }),
    ]);
  } catch (e) {
    loadError = true;
    console.error("[admin/gas-services] load failed", e);
  }

  const filterForm = (
    <form className="flex flex-wrap items-end gap-3" method="get" action="/admin/gas-services">
      {selectedMunicipalityId ? <input type="hidden" name="municipalityId" value={selectedMunicipalityId} /> : null}
      <div className="min-w-[10rem] flex-1 sm:max-w-[11rem]">
        <label className="mb-1.5 block text-sm font-medium text-[var(--gov-text)]">من تاريخ</label>
        <input className="gov-input w-full px-3 py-2.5 text-sm" type="date" name="dateFrom" defaultValue={sp.dateFrom ?? ""} />
      </div>
      <div className="min-w-[10rem] flex-1 sm:max-w-[11rem]">
        <label className="mb-1.5 block text-sm font-medium text-[var(--gov-text)]">إلى تاريخ</label>
        <input className="gov-input w-full px-3 py-2.5 text-sm" type="date" name="dateTo" defaultValue={sp.dateTo ?? ""} />
      </div>
      <button type="submit" className="gov-btn-primary px-5 py-2.5 text-sm font-semibold">
        تطبيق
      </button>
    </form>
  );

  const rows = list.map((r) => ({
    id: r.id,
    gasRequestNumber: r.gasRequestNumber,
    area: r.area,
    agentName: r.assignedAgent?.name ?? "",
    municipalityName: r.municipality.name,
    fullName: r.fullName,
    phone: r.phone,
    nationalId: r.nationalId,
    isCompleted: r.isCompleted,
    createdAt: r.createdAt.toISOString(),
    completedAt: r.completedAt?.toISOString() ?? null,
  }));

  return (
    <div>
      <AdminPageMunicipalityScopeForm municipalities={municipalities} current={selectedMunicipalityId} />
      {loadError ? (
        <div className="gov-card mb-6 border-rose-200 bg-rose-50 p-4 text-sm text-rose-900">
          تعذّر تحميل بعض بيانات خدمات الغاز. أعد المحاولة بعد اكتمال ترحيل قاعدة البيانات أو راجع سجلات Render.
        </div>
      ) : null}
      <GasAgentCreateForm municipalities={municipalities} showMunicipalityPicker={municipalities.length > 0} />

      <div className="gov-card mb-6 p-4">
        <h2 className="mb-3 text-base font-bold text-[var(--gov-text)]">قائمة معتمدي الغاز</h2>
        {agents.length === 0 ? (
          <p className="text-sm text-[var(--gov-muted)]">لا يوجد معتمدون مضافون حالياً.</p>
        ) : (
          <div className="gov-table-wrap">
            <table className="gov-table">
              <thead>
                <tr>
                  <th>الاسم</th>
                  <th>البلدية</th>
                  <th>رقم الهاتف</th>
                  <th>المنطقة</th>
                  <th>الحالة</th>
                  <th>إجراء</th>
                </tr>
              </thead>
              <tbody>
                {agents.map((a) => (
                  <tr key={a.id}>
                    <td>{a.name}</td>
                    <td>{a.municipality?.name ?? "—"}</td>
                    <td dir="ltr">{a.phone ?? "—"}</td>
                    <td>{a.gasArea ?? "—"}</td>
                    <td>{a.isActive ? "مفعّل" : "معطّل"}</td>
                    <td className="whitespace-nowrap">
                      <div className="flex flex-wrap items-center gap-2">
                        <GasAgentEditDialog agent={a} />
                        <GasAgentBarcodeDialog agent={a} />
                        <GasAgentToggleButton userId={a.id} isActive={a.isActive} name={a.name} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <AdminGasRequestsTableWithSearch rows={rows} filterForm={filterForm} />
    </div>
  );
}
