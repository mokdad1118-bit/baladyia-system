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
  if (!s?.user) redirect("/citizen/login?next=/requests");
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
    <div className="w-full min-w-0 max-w-full">
      <div className="mb-6 flex flex-col gap-3 border-b border-[var(--gov-border)] pb-4 sm:flex-row sm:items-end sm:justify-between">
        <header className="gov-page-heading">
          <h1 className="text-lg font-bold text-[var(--gov-text)] md:text-xl">طلباتي</h1>
          <p className="mt-1 text-sm text-[var(--gov-muted)]">متابعة الحالة والمرجع لكل طلب.</p>
        </header>
        <Link
          href="/services"
          className="gov-btn-secondary inline-flex min-h-11 w-full shrink-0 items-center justify-center px-4 text-sm font-semibold no-underline sm:w-auto"
        >
          + طلب جديد
        </Link>
      </div>

      <div className="gov-card mb-6 p-4">
        <form className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end" method="get" action="/requests">
          <div className="min-w-0 flex-1 sm:min-w-[10rem] sm:max-w-[11rem]">
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
          <div className="min-w-0 flex-1 sm:min-w-[10rem] sm:max-w-[11rem]">
            <label className="mb-1.5 block text-sm font-medium text-[var(--gov-text)]">من تاريخ</label>
            <input className="gov-input w-full px-3 py-2.5 text-sm" type="date" name="dateFrom" defaultValue={dateFrom ?? ""} />
          </div>
          <div className="min-w-0 flex-1 sm:min-w-[10rem] sm:max-w-[11rem]">
            <label className="mb-1.5 block text-sm font-medium text-[var(--gov-text)]">إلى تاريخ</label>
            <input className="gov-input w-full px-3 py-2.5 text-sm" type="date" name="dateTo" defaultValue={dateTo ?? ""} />
          </div>
          <button type="submit" className="gov-btn-primary min-h-11 w-full px-5 py-2.5 text-sm font-semibold sm:w-auto">
            تطبيق
          </button>
        </form>
      </div>

      {success && no && (
        <div className="mb-4 border border-[var(--gov-flag-green)]/40 bg-[var(--gov-flag-green)]/5 px-4 py-3 text-sm text-[var(--gov-text)]">
          تم إرسال الطلب بنجاح. الرقم المرجعي: <strong className="font-mono">{no}</strong>
        </div>
      )}
      {list.length === 0 ? (
        <div className="gov-card p-10 text-center text-sm text-[var(--gov-muted)]">لا طلبات مطابقة.</div>
      ) : (
        <>
          <ul className="space-y-2 md:hidden">
            {list.map((r) => (
              <li key={r.id}>
                <Link
                  href={`/requests/${r.id}`}
                  className="gov-card flex flex-col gap-2 p-4 text-sm no-underline transition-colors hover:bg-[#f7f8fa] active:bg-[#eef6f1]"
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <span className="font-mono font-semibold text-[var(--gov-primary)]">{r.requestNumber}</span>
                    <StatusBadge status={r.status} />
                  </div>
                  <p className="break-words text-[var(--gov-text)]">{r.service.name}</p>
                  <time className="text-xs text-[var(--gov-muted)]" dateTime={r.createdAt.toISOString()}>
                    {r.createdAt.toLocaleDateString("ar")}
                  </time>
                </Link>
              </li>
            ))}
          </ul>
          <div className="gov-table-wrap hidden md:block">
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
                        href={`/requests/${r.id}`}
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
        </>
      )}
    </div>
  );
}
