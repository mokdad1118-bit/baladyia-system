import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { markAllNotificationsRead } from "@/actions/request-staff";
import { UserRole } from "@/generated/prisma/enums";
import { CitizenNotificationsView } from "@/components/citizen/CitizenNotificationsView";

export default async function CitizenNotificationsPage() {
  const s = await auth();
  if (!s?.user || s.user.role !== UserRole.CITIZEN) {
    redirect("/citizen/welcome?next=/citizen/notifications");
  }
  const list = await db.notification.findMany({
    where: { userId: s.user.id },
    orderBy: { createdAt: "desc" },
    take: 100,
    select: {
      id: true,
      title: true,
      message: true,
      read: true,
      createdAt: true,
      requestId: true,
      gasRequestId: true,
      returneeRegistrationId: true,
      type: true,
    },
  });
  return (
    <div className="px-3 md:px-0">
      <div className="mb-4 flex flex-col gap-3 border-b border-[var(--gov-border)] pb-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-[var(--gov-text)]">الإشعارات</h1>
          <p className="mt-1 text-sm text-[var(--gov-muted)]">
            اختر قسم الخدمة ثم اضغط زر العرض لفتح نافذة التنبيهات الخاصة به.
          </p>
        </div>
        <form action={markAllNotificationsRead}>
          <button
            type="submit"
            className="inline-flex min-h-10 items-center justify-center border border-[var(--gov-border)] bg-white px-4 text-sm font-semibold hover:bg-[#f3f5f7]"
          >
            وضع الكل كمقروء
          </button>
        </form>
      </div>
      <CitizenNotificationsView list={list} requestsBasePath="/citizen/requests" />
    </div>
  );
}
