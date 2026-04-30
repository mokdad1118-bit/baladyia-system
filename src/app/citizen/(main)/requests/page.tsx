import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { StatusBadge } from "@/components/ui/status-badge";
import { requestStatusAr } from "@/lib/labels";
import { RequestStatus } from "@/generated/prisma/enums";
import { parseDateEndParam, parseDateStartParam } from "@/lib/request-list-filters";

type S = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export default async function CitizenRequestsPage({ searchParams }: S) {
  const s = await auth();
  if (!s?.user) redirect("/citizen/login?next=/citizen/requests");
  const sp = await searchParams;
  const success = sp.success === "1";
  const no = typeof sp.no === "string" ? sp.no : null;
  const statusRaw = typeof sp.status === "string" ? sp.status : "";
  const dateFrom = typeof sp.dateFrom === "string" ? sp.dateFrom : undefined;
  const dateTo = typeof sp.dateTo === "string" ? sp.dateTo : undefined;

  const statusFilter =
    statusRaw && Object.values(RequestStatus).includes(statusRaw as RequestStatus)
      ? (statusRaw as RequestStatus)
      : undefined;
  const d0 = parseDateStartParam(dateFrom);
  const d1 = parseDateEndParam(dateTo);

  const list = await db.request.findMany({
    where: {
      citizenId: s.user.id,
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
    include: { service: true },
  });

  return (
    <div className="w-full px-3 md:px-0">
      <div className="mb-6 flex flex-col gap-3 border-b border-[var(--gov-border)] pb-4 sm:flex-row sm:items-end sm:justify-between">
        <header className="gov-page-heading">
          <h1 className="text-lg font-bold text-[var(--gov-text)] md:text-xl">طلباتي</h1>
          <p className="mt-1 text-sm text-[var(--gov-muted)]">متابعة الحالة والمرجع لكل طلب.</p>
        </header>
        <Link
          href="/citizen/services"
          className="gov-btn-secondary inline-flex min-h-10 items-center justify-center px-4 text-sm font-semibold no-underline"
        >
          + طلب جديد
        </Link>
      </div>

      <div className="gov-card mb-6 p-4">
        <form className="flex flex-wrap items-end gap-3" method="get" action="/citizen/requests">
          <div className="min-w-[10rem] flex-1 sm:max-w-[11rem]">
            <label className="mb-1.5 block text-sm font-medium text-[var(--gov-text)]">الحالة</label>
            <select className="gov-input w-full px-3 py-2.5 text-sm" name="status" defaultValue={statusRaw}>
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
            <input className="gov-input w-full px-3 py-2.5 text-sm" type="date" name="dateFrom" defaultValue={dateFrom ?? ""} />
          </div>
          <div className="min-w-[10rem] flex-1 sm:max-w-[11rem]">
            <label className="mb-1.5 block text-sm font-medium text-[var(--gov-text)]">إلى تاريخ</label>
            <input className="gov-input w-full px-3 py-2.5 text-sm" type="date" name="dateTo" defaultValue={dateTo ?? ""} />
          </div>
          <button type="submit" className="gov-btn-primary px-5 py-2.5 text-sm font-semibold">
            تطبيق
          </button>
        </form>
      </div>

      {success && (
        <div
          role="status"
          className="mb-4 border border-[var(--gov-flag-green)]/40 bg-[var(--gov-flag-green)]/5 px-4 py-3 text-sm text-[var(--gov-text)]"
        >
          <p className="font-semibold text-[var(--gov-text)]">قد تم إرسال طلبك بنجاح.</p>
          {no ? (
            <p className="mt-2">
              الرقم المرجعي: <strong className="font-mono">{no}</strong>
            </p>
          ) : null}
          <p className="mt-2 leading-relaxed">
            تابع تفاصيل طلبك من تبويب <span className="font-semibold">طلباتي</span> داخل التطبيق.
          </p>
        </div>
      )}
      {list.length === 0 ? (
        <div className="gov-card p-10 text-center text-sm text-[var(--gov-muted)]">لا طلبات مطابقة.</div>
      ) : (
        <div className="gov-table-wrap">
          <table className="gov-table">
            <thead>
              <tr>
                <th>الرقم</th>
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
                      href={`/citizen/requests/${r.id}`}
                      className="font-mono font-semibold text-[var(--gov-primary)] hover:underline"
                    >
                      {r.requestNumber}
                    </Link>
                  </td>
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
