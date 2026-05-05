import { db } from "@/lib/db";
import { UserRole } from "@/generated/prisma/enums";
import { parseDateEndParam, parseDateStartParam } from "@/lib/request-list-filters";
import { AdminGasRequestsTableWithSearch } from "@/components/admin/AdminGasRequestsTableWithSearch";
import { GasAgentCreateForm } from "@/components/admin/GasAgentCreateForm";
import { GasAgentEditDialog } from "@/components/admin/GasAgentEditDialog";
import { GasAgentToggleButton } from "@/components/admin/GasAgentToggleButton";

type S = { searchParams: Promise<{ dateFrom?: string; dateTo?: string }> };

export default async function AdminGasServicesPage({ searchParams }: S) {
  const sp = await searchParams;
  const d0 = parseDateStartParam(sp.dateFrom);
  const d1 = parseDateEndParam(sp.dateTo);

  const list = await db.gasRequest.findMany({
    where: d0 || d1 ? { createdAt: { ...(d0 ? { gte: d0 } : {}), ...(d1 ? { lte: d1 } : {}) } } : {},
    orderBy: { createdAt: "desc" },
    take: 500,
    include: {
      assignedAgent: { select: { name: true } },
    },
  });
  const agents = await db.user.findMany({
    where: { role: UserRole.GAS_AGENT },
    orderBy: [{ gasArea: "asc" }, { createdAt: "asc" }],
    select: {
      id: true,
      name: true,
      phone: true,
      gasArea: true,
      isActive: true,
    },
  });

  const filterForm = (
    <form className="flex flex-wrap items-end gap-3" method="get" action="/admin/gas-services">
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
    fullName: r.fullName,
    phone: r.phone,
    nationalId: r.nationalId,
    isCompleted: r.isCompleted,
    createdAt: r.createdAt.toISOString(),
  }));

  return (
    <div>
      <GasAgentCreateForm />

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
                    <td dir="ltr">{a.phone ?? "—"}</td>
                    <td>{a.gasArea ?? "—"}</td>
                    <td>{a.isActive ? "مفعّل" : "معطّل"}</td>
                    <td className="whitespace-nowrap">
                      <div className="flex flex-wrap items-center gap-2">
                        <GasAgentEditDialog agent={a} />
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
