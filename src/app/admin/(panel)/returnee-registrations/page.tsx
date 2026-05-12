import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { UserRole } from "@/generated/prisma/enums";
import { ADMIN_NAV_BADGE_NOTIFICATION_TYPES } from "@/lib/admin-nav-badges";
import { parseDateEndParam, parseDateStartParam } from "@/lib/request-list-filters";
import { AdminReturneeRegistrationsTableWithSearch } from "@/components/admin/AdminReturneeRegistrationsTableWithSearch";

type S = { searchParams: Promise<{ dateFrom?: string; dateTo?: string }> };

export default async function AdminReturneeRegistrationsPage({ searchParams }: S) {
  const session = await auth();
  if (session?.user?.role === UserRole.ADMIN) {
    await db.notification.updateMany({
      where: {
        userId: session.user.id,
        read: false,
        type: { in: [...ADMIN_NAV_BADGE_NOTIFICATION_TYPES.social] },
      },
      data: { read: true },
    });
    revalidatePath("/admin");
  }

  const sp = await searchParams;
  const d0 = parseDateStartParam(sp.dateFrom);
  const d1 = parseDateEndParam(sp.dateTo);

  const list = await db.returneeRegistration.findMany({
    where: d0 || d1 ? { createdAt: { ...(d0 ? { gte: d0 } : {}), ...(d1 ? { lte: d1 } : {}) } } : {},
    orderBy: { createdAt: "desc" },
    take: 500,
  });

  const filterForm = (
    <form className="flex flex-wrap items-end gap-3" method="get" action="/admin/returnee-registrations">
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

  const rows = list.map((r) => ({
    id: r.id,
    registrationNumber: r.registrationNumber,
    fullName: r.fullName,
    birthDate: r.birthDate.toISOString(),
    nationalId: r.nationalId,
    phone: r.phone,
    email: r.email,
    returnStatementPath: r.returnStatementPath,
    createdAt: r.createdAt.toISOString(),
    status: r.status,
  }));

  return (
    <div>
      <AdminReturneeRegistrationsTableWithSearch rows={rows} filterForm={filterForm} />
    </div>
  );
}
