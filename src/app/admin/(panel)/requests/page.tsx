import { headers } from "next/headers";
import { db } from "@/lib/db";
import { requestStatusAr } from "@/lib/labels";
import { RequestStatus } from "@/generated/prisma/enums";
import { parseDateEndParam, parseDateStartParam } from "@/lib/request-list-filters";
import { buildRequestAttachmentExportLinks } from "@/lib/admin-requests-export";
import { requestExportBaseUrl } from "@/lib/request-export-base-url";
import { AdminRequestsTableWithSearch } from "@/components/admin/AdminRequestsTableWithSearch";

type S = { searchParams: Promise<{ status?: string; dateFrom?: string; dateTo?: string }> };

export default async function AdminRequestsPage({ searchParams }: S) {
  const sp = await searchParams;
  const st = sp.status;
  const statusFilter =
    st && Object.values(RequestStatus).includes(st as RequestStatus) ? (st as RequestStatus) : undefined;
  const d0 = parseDateStartParam(sp.dateFrom);
  const d1 = parseDateEndParam(sp.dateTo);

  const list = await db.request.findMany({
    where: {
      ...(statusFilter ? { status: statusFilter } : {}),
      ...(d0 || d1
        ? {
            createdAt: {
              ...(d0 ? { gte: d0 } : {}),
              ...(d1 ? { lte: d1 } : {}),
            },
          }
        : {}),
    },
    orderBy: { createdAt: "desc" },
    take: 300,
    include: {
      service: true,
      citizen: true,
      assignee: true,
      files: { select: { id: true, storedName: true, mimeType: true } },
    },
  });

  const baseUrl = requestExportBaseUrl(await headers());

  const filterForm = (
    <form className="flex flex-wrap items-end gap-3" method="get" action="/admin/requests">
      <div className="min-w-[10rem] flex-1 sm:max-w-xs">
        <label className="mb-1.5 block text-sm font-medium text-[var(--gov-text)]">الحالة</label>
        <select className="gov-input w-full px-3 py-2.5 text-sm" name="status" defaultValue={st ?? ""}>
          <option value="">الكل</option>
          {(Object.keys(requestStatusAr) as RequestStatus[]).map((k) => (
            <option key={k} value={k}>
              {requestStatusAr[k]}
            </option>
          ))}
        </select>
      </div>
      <div className="min-w-[10rem] flex-1 sm:max-w-[11rem]">
        <label className="mb-1.5 block text-sm font-medium text-[var(--gov-text)]">من تاريخ</label>
        <input
          className="gov-input w-full px-3 py-2.5 text-sm"
          type="date"
          name="dateFrom"
          defaultValue={sp.dateFrom ?? ""}
        />
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
    requestNumber: r.requestNumber,
    citizenName: r.citizen.name,
    serviceName: r.service.name,
    status: r.status,
    createdAt: r.createdAt.toISOString(),
    detailHref: `/admin/requests/${r.id}`,
    attachments: buildRequestAttachmentExportLinks(r.files, baseUrl),
  }));

  return <AdminRequestsTableWithSearch rows={rows} filterForm={filterForm} />;
}
