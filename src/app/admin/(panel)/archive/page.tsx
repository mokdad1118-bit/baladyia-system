import { auth } from "@/auth";
import { AdminArchiveClient } from "@/components/admin/AdminArchiveClient";
import { db } from "@/lib/db";
import { requireStaffPanelPermission } from "@/lib/admin-guard";
import { isSuperAdminRole } from "@/lib/roles";
import { listActiveMunicipalities } from "@/lib/municipalities";
import { staffMunicipalityIdFilter } from "@/lib/municipality-scope";
import { parseDateEndParam, parseDateStartParam } from "@/lib/request-list-filters";
import { requestExportBaseUrl } from "@/lib/request-export-base-url";
import { headers } from "next/headers";

type Props = {
  searchParams: Promise<{ municipalityId?: string; dateFrom?: string; dateTo?: string }>;
};

export default async function AdminArchivePage({ searchParams }: Props) {
  const session = await auth();
  await requireStaffPanelPermission(session, "archive");

  const sp = await searchParams;
  const isSuperAdmin = session?.user ? isSuperAdminRole(session.user.role) : false;
  const selectedMunicipalityId =
    isSuperAdmin && sp.municipalityId && sp.municipalityId !== "__ALL__" ? sp.municipalityId : "";
  const municipalityFilter = isSuperAdmin
    ? selectedMunicipalityId
      ? { municipalityId: selectedMunicipalityId }
      : {}
    : staffMunicipalityIdFilter(session);
  const d0 = parseDateStartParam(sp.dateFrom);
  const d1 = parseDateEndParam(sp.dateTo);

  const [municipalities, list, baseUrl] = await Promise.all([
    isSuperAdmin
      ? listActiveMunicipalities()
      : session?.user?.municipalityId
        ? db.municipality.findMany({
            where: { id: session.user.municipalityId },
            select: { id: true, name: true },
          })
        : Promise.resolve([]),
    db.archiveEntry.findMany({
      where: {
        ...municipalityFilter,
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
      take: 500,
      include: {
        municipality: { select: { name: true } },
        createdBy: { select: { name: true } },
      },
    }),
    requestExportBaseUrl(await headers()),
  ]);

  const filterForm = (
    <form className="flex flex-wrap items-end gap-3" method="get" action="/admin/archive">
      {isSuperAdmin ? (
        <div className="min-w-[12rem] flex-1 sm:max-w-xs">
          <label className="mb-1.5 block text-sm font-medium text-[var(--gov-text)]">البلدية</label>
          <select className="gov-input w-full px-3 py-2.5 text-sm" name="municipalityId" defaultValue={selectedMunicipalityId || "__ALL__"}>
            <option value="__ALL__">كل البلديات</option>
            {municipalities.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
        </div>
      ) : null}
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

  const root = baseUrl.replace(/\/$/, "");
  const rows = list.map((r) => ({
    id: r.id,
    requestNumber: r.requestNumber,
    citizenName: r.citizenName,
    municipalityName: r.municipality.name,
    createdByName: r.createdBy?.name ?? "",
    createdAt: r.createdAt.toISOString(),
    fileLabel: r.fileMime.startsWith("image/") ? "صورة" : "PDF",
    fileHref: `${root}/api/archive-files/${r.id}`,
  }));

  return (
    <AdminArchiveClient
      rows={rows}
      filterForm={filterForm}
      municipalities={municipalities}
      fixedMunicipalityId={isSuperAdmin ? undefined : session?.user?.municipalityId ?? undefined}
    />
  );
}
