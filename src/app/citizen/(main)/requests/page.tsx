import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { StatusBadge } from "@/components/ui/status-badge";

type S = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export default async function CitizenRequestsPage({ searchParams }: S) {
  const s = await auth();
  if (!s?.user) redirect("/citizen/login?next=/citizen/requests");
  const sp = await searchParams;
  const success = sp.success === "1";
  const no = typeof sp.no === "string" ? sp.no : null;

  const municipalityRequests = await db.request.findMany({
    where: {
      citizenId: s.user.id,
    },
    orderBy: { createdAt: "desc" },
    include: { service: true },
  });
  const gasRequests = await db.gasRequest.findMany({
    where: { citizenId: s.user.id },
    orderBy: { createdAt: "desc" },
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

      <section className="space-y-4">
        <details open className="gov-card p-4">
          <summary className="gov-btn-primary cursor-pointer list-none px-4 py-2 text-sm font-semibold md:text-base">
            طلباتك المخصصة لخدمات البلدية
          </summary>
          <div className="mt-4">
            {municipalityRequests.length === 0 ? (
              <div className="rounded-xl border border-dashed border-[var(--gov-border)] p-8 text-center text-sm text-[var(--gov-muted)]">
                لا توجد طلبات بلدية بعد.
              </div>
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
                    {municipalityRequests.map((r) => (
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
        </details>

        <details open className="gov-card p-4">
          <summary className="gov-btn-primary cursor-pointer list-none px-4 py-2 text-sm font-semibold md:text-base">
            طلباتك المخصصة لخدمات الغاز
          </summary>
          <div className="mt-4">
            {gasRequests.length === 0 ? (
              <div className="rounded-xl border border-dashed border-[var(--gov-border)] p-8 text-center text-sm text-[var(--gov-muted)]">
                لا توجد طلبات غاز بعد.
              </div>
            ) : (
              <div className="gov-table-wrap">
                <table className="gov-table">
                  <thead>
                    <tr>
                      <th>رقم طلب الغاز</th>
                      <th>الاسم الثلاثي</th>
                      <th>رقم الهاتف</th>
                      <th>الرقم الوطني</th>
                      <th>الحالة</th>
                      <th>التاريخ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {gasRequests.map((g) => (
                      <tr key={g.id}>
                        <td className="font-mono font-semibold text-[var(--gov-primary)]">{g.gasRequestNumber}</td>
                        <td>{g.fullName}</td>
                        <td dir="ltr">{g.phone}</td>
                        <td dir="ltr">{g.nationalId}</td>
                        <td>
                          {g.isCompleted ? (
                            <span className="rounded-full bg-emerald-100 px-2 py-1 text-xs font-semibold text-emerald-800">
                              تم التسليم
                            </span>
                          ) : (
                            <span className="rounded-full bg-amber-100 px-2 py-1 text-xs font-semibold text-amber-800">
                              قيد المتابعة
                            </span>
                          )}
                        </td>
                        <td className="whitespace-nowrap text-[var(--gov-muted)]">{g.createdAt.toLocaleDateString("ar")}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </details>
      </section>
    </div>
  );
}
