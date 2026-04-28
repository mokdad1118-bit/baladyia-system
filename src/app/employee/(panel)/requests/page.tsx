import Link from "next/link";
import { db } from "@/lib/db";
import { requestStatusAr } from "@/lib/labels";
import { RequestStatus } from "@/generated/prisma/enums";
import { StatusBadge } from "@/components/ui/status-badge";
import { parseDateEndParam, parseDateStartParam } from "@/lib/request-list-filters";

type S = { searchParams: Promise<{ status?: string; dateFrom?: string; dateTo?: string }> };

export default async function EmployeeRequestsPage({ searchParams }: S) {
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
    take: 200,
    include: { service: true, citizen: true, assignee: true },
  });
  return (
    <div>
      <header className="gov-page-heading mb-6 border-b border-[var(--gov-border)] pb-4">
        <h1 className="text-lg font-bold text-[var(--gov-text)] md:text-xl">الطلبات</h1>
        <p className="mt-1 text-sm text-[var(--gov-muted)]">تصفية حسب الحالة والتاريخ ثم فتح التفاصيل.</p>
      </header>
      <div className="gov-card mb-6 p-4">
        <form className="flex flex-wrap items-end gap-3" method="get" action="/employee/requests">
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
      </div>
      {list.length === 0 ? (
        <p className="text-center text-sm text-[var(--gov-muted)]">لا طلبات مطابقة</p>
      ) : (
        <div className="gov-table-wrap">
          <table className="gov-table">
            <thead>
              <tr>
                <th>رقم الطلب</th>
                <th>المواطن</th>
                <th>الخدمة</th>
                <th>الحالة</th>
                <th>التاريخ</th>
              </tr>
            </thead>
            <tbody>
              {list.map((r) => (
                <tr key={r.id}>
                  <td>
                    <Link
                      href={`/employee/requests/${r.id}`}
                      className="font-mono font-semibold text-[var(--gov-primary)] hover:underline"
                    >
                      {r.requestNumber}
                    </Link>
                  </td>
                  <td>{r.citizen.name}</td>
                  <td>{r.service.name}</td>
                  <td>
                    <StatusBadge status={r.status} />
                  </td>
                  <td className="whitespace-nowrap text-[var(--gov-muted)]">{r.createdAt.toLocaleDateString("ar")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
