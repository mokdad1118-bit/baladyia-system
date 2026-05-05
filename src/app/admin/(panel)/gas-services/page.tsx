import { db } from "@/lib/db";
import { parseDateEndParam, parseDateStartParam } from "@/lib/request-list-filters";
import { AdminGasRequestsTableWithSearch } from "@/components/admin/AdminGasRequestsTableWithSearch";

type S = { searchParams: Promise<{ dateFrom?: string; dateTo?: string }> };

export default async function AdminGasServicesPage({ searchParams }: S) {
  const sp = await searchParams;
  const d0 = parseDateStartParam(sp.dateFrom);
  const d1 = parseDateEndParam(sp.dateTo);

  const list = await db.gasRequest.findMany({
    where: d0 || d1 ? { createdAt: { ...(d0 ? { gte: d0 } : {}), ...(d1 ? { lte: d1 } : {}) } } : {},
    orderBy: { createdAt: "desc" },
    take: 500,
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
    fullName: r.fullName,
    phone: r.phone,
    nationalId: r.nationalId,
    createdAt: r.createdAt.toISOString(),
  }));

  return <AdminGasRequestsTableWithSearch rows={rows} filterForm={filterForm} />;
}
