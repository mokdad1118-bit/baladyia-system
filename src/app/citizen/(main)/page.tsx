import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { StatusBadge } from "@/components/ui/status-badge";

export default async function CitizenHomePage() {
  const s = await auth();
  if (!s?.user) redirect("/citizen/login?next=/citizen");
  const recent = await db.request.findMany({
    where: { citizenId: s.user.id },
    orderBy: { createdAt: "desc" },
    take: 5,
    include: { service: true },
  });
  return (
    <div className="w-full px-3 md:px-0">
      <header className="gov-page-heading gov-card mb-6 p-5">
        <h1 className="text-lg font-bold text-[var(--gov-text)] md:text-xl">الرئيسية</h1>
        <p className="mt-1 text-sm text-[var(--gov-muted)]">متابعة الطلبات والخدمات البلدية.</p>
        <div className="mt-5 flex flex-wrap gap-2">
          <Link
            href="/citizen/services"
            className="gov-btn-primary inline-flex px-4 py-2.5 text-sm font-semibold no-underline"
          >
            تقديم طلب
          </Link>
          <Link
            href="/citizen/requests"
            className="gov-btn-secondary inline-flex px-4 py-2.5 text-sm font-semibold no-underline"
          >
            طلباتي
          </Link>
        </div>
      </header>
      <section className="gov-card overflow-hidden">
        <div className="border-b border-[var(--gov-border)] bg-[#e8ecf1] px-4 py-2.5 text-sm font-semibold text-[var(--gov-text)]">
          آخر الطلبات
        </div>
        {recent.length === 0 ? (
          <p className="p-5 text-center text-sm text-[var(--gov-muted)]">لا توجد طلبات بعد.</p>
        ) : (
          <ul className="divide-y divide-[var(--gov-border)]">
            {recent.map((r) => (
              <li key={r.id}>
                <Link
                  href={`/citizen/requests/${r.id}`}
                  className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 text-sm no-underline hover:bg-[#f7f8fa]"
                >
                  <span>
                    <span className="font-mono font-semibold text-[var(--gov-text)]">{r.requestNumber}</span>
                    <span className="me-2 text-[var(--gov-muted)]"> — {r.service.name}</span>
                  </span>
                  <StatusBadge status={r.status} />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
