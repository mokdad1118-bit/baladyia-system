import { auth } from "@/auth";
import { db } from "@/lib/db";
import { requireStaffPanelPermission } from "@/lib/admin-guard";
import { staffMunicipalityIdFilter } from "@/lib/municipality-scope";
import { AdminOperationLogWithSearch } from "@/components/admin/AdminOperationLogWithSearch";
import { userRoleAr } from "@/lib/labels";

type Props = {
  searchParams: Promise<{
    action?: string;
    module?: string;
    dateFrom?: string;
    dateTo?: string;
  }>;
};

const actions = [
  ["", "كل العمليات"],
  ["LOGIN", "دخول"],
  ["CREATE", "إضافة"],
  ["UPDATE", "تعديل"],
  ["DELETE", "حذف"],
  ["ACTIVATE", "تفعيل"],
  ["DEACTIVATE", "تعطيل"],
  ["UPDATE_STATUS", "تغيير حالة"],
  ["ADD_NOTE", "ملاحظة"],
  ["REPLY", "رد"],
  ["COMPLETE", "إكمال"],
] as const;

const modules = [
  ["", "كل الأقسام"],
  ["AUTH", "الدخول"],
  ["USERS", "الحسابات"],
  ["SERVICES", "الخدمات"],
  ["REQUESTS", "طلبات المدينة"],
  ["GAS", "الغاز"],
  ["SOCIAL_SERVICES", "الخدمات الاجتماعية"],
  ["FEEDBACK", "الشكاوى"],
  ["MUNICIPALITIES", "البلديات"],
] as const;

function parseDateStart(raw: string | undefined) {
  if (!raw) return undefined;
  const d = new Date(`${raw}T00:00:00.000`);
  return Number.isNaN(d.getTime()) ? undefined : d;
}

function parseDateEnd(raw: string | undefined) {
  if (!raw) return undefined;
  const d = new Date(`${raw}T23:59:59.999`);
  return Number.isNaN(d.getTime()) ? undefined : d;
}

export default async function AdminOperationLogPage({ searchParams }: Props) {
  const session = await auth();
  await requireStaffPanelPermission(session, "operationLog");

  const sp = await searchParams;
  const action = actions.some(([value]) => value === sp.action) ? sp.action : "";
  const module = modules.some(([value]) => value === sp.module) ? sp.module : "";
  const dateFrom = parseDateStart(sp.dateFrom);
  const dateTo = parseDateEnd(sp.dateTo);

  const rows = await db.operationLog.findMany({
    where: {
      ...staffMunicipalityIdFilter(session),
      ...(action ? { action } : {}),
      ...(module ? { module } : {}),
      ...(dateFrom || dateTo
        ? {
            createdAt: {
              ...(dateFrom ? { gte: dateFrom } : {}),
              ...(dateTo ? { lte: dateTo } : {}),
            },
          }
        : {}),
    },
    orderBy: { createdAt: "desc" },
    take: 800,
    include: {
      actor: { select: { name: true, role: true, email: true, phone: true } },
      request: {
        select: {
          id: true,
          requestNumber: true,
          citizen: { select: { name: true } },
          service: { select: { name: true } },
        },
      },
    },
  });

  const filterForm = (
    <form className="flex flex-wrap items-end gap-3" method="get" action="/admin/operation-log">
      <div className="min-w-[10rem] flex-1 sm:max-w-xs">
        <label className="mb-1.5 block text-sm font-medium text-[var(--gov-text)]">نوع العملية</label>
        <select className="gov-input w-full px-3 py-2.5 text-sm" name="action" defaultValue={action}>
          {actions.map(([value, label]) => (
            <option key={value || "all"} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>
      <div className="min-w-[10rem] flex-1 sm:max-w-xs">
        <label className="mb-1.5 block text-sm font-medium text-[var(--gov-text)]">القسم</label>
        <select className="gov-input w-full px-3 py-2.5 text-sm" name="module" defaultValue={module}>
          {modules.map(([value, label]) => (
            <option key={value || "all"} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>
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

  return (
    <AdminOperationLogWithSearch
      filterForm={filterForm}
      rows={rows.map((row) => ({
        id: row.id,
        createdAt: row.createdAt.toISOString(),
        action: row.action,
        module: row.module,
        title: row.title,
        description: row.description,
        actorName: row.actor?.name ?? "",
        actorRole: row.actor?.role ? userRoleAr[row.actor.role] : "",
        requestNumber: row.request?.requestNumber ?? "",
        citizenName: row.request?.citizen.name ?? "",
        serviceName: row.request?.service.name ?? "",
        requestHref: row.requestId ? `/admin/requests/${row.requestId}` : null,
        entityType: row.entityType ?? "",
        entityId: row.entityId ?? "",
        ipAddress: row.ipAddress ?? "",
        metadata: row.metadataJson,
      }))}
    />
  );
}
