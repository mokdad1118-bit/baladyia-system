import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { markAllNotificationsRead } from "@/actions/request-staff";
import Link from "next/link";
import { UserRole } from "@/generated/prisma/enums";

export default async function CitizenNotificationsPage() {
  const s = await auth();
  if (!s?.user || s.user.role !== UserRole.CITIZEN) {
    redirect("/login?next=/notifications");
  }
  const list = await db.notification.findMany({
    where: { userId: s.user.id },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
  return (
    <div className="w-full min-w-0 max-w-full">
      <div className="mb-4 flex flex-col gap-3 border-b border-[var(--gov-border)] pb-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-[var(--gov-text)]">الإشعارات</h1>
          <p className="mt-1 text-sm text-[var(--gov-muted)]">تنبيهات الطلبات وتحديثات الحالة.</p>
        </div>
        <form action={markAllNotificationsRead} className="w-full sm:w-auto">
          <button
            type="submit"
            className="inline-flex min-h-11 w-full items-center justify-center border border-[var(--gov-border)] bg-white px-4 text-sm font-semibold hover:bg-[#f3f5f7] sm:w-auto"
          >
            وضع الكل كمقروء
          </button>
        </form>
      </div>
      {list.length === 0 ? (
        <div className="gov-card p-10 text-center text-sm text-[var(--gov-muted)]">لا إشعارات حالياً</div>
      ) : (
        <ul className="space-y-3">
          {list.map((n) => (
            <li key={n.id} className={`gov-card p-4 ${n.read ? "" : "border-s-[3px] border-s-[var(--gov-primary)]"}`}>
              <div className="flex flex-wrap justify-between gap-2">
                <h2 className="font-semibold text-[var(--gov-text)]">{n.title}</h2>
                <time className="text-xs text-[var(--gov-muted)]" dateTime={n.createdAt.toISOString()}>
                  {n.createdAt.toLocaleString("ar")}
                </time>
              </div>
              <p className="mt-1 text-sm text-[var(--gov-muted)]">{n.message}</p>
              {n.requestId && (
                <Link
                  className="mt-2 inline-flex min-h-10 items-center text-sm font-semibold text-[var(--gov-primary)] hover:underline"
                  href={`/requests/${n.requestId}`}
                >
                  فتح الطلب ←
                </Link>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
