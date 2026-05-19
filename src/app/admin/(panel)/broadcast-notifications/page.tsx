import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { UserRole } from "@/generated/prisma/enums";
import { db } from "@/lib/db";
import { isSuperAdminRole } from "@/lib/roles";
import { requireAdminPanel } from "@/lib/admin-guard";
import { PageHeader } from "@/components/ui/page-header";
import { Badge } from "@/components/ui/badge";
import { BroadcastNotificationForm } from "@/components/admin/BroadcastNotificationForm";

const roleLabel: Record<string, string> = {
  citizen: "مواطن",
  municipality_admin: "مدير بلدية",
  governorate_admin: "مدير المحافظة",
};

const statusLabel: Record<string, string> = {
  SENT: "تم الإرسال",
  FAILED: "فشل",
};

export default async function BroadcastNotificationsPage() {
  const session = await auth();
  await requireAdminPanel(session);
  if (!session?.user) redirect("/admin/login");
  const isSuperAdmin = isSuperAdminRole(session.user.role);
  if (!isSuperAdmin && session.user.role !== UserRole.MUNICIPALITY_ADMIN) redirect("/admin");

  const municipalityFilter = isSuperAdmin ? {} : { id: session.user.municipalityId ?? "__none__" };
  const municipalities = await db.municipality.findMany({
    where: { isActive: true, ...municipalityFilter },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    select: { id: true, name: true },
  });
  const forcedMunicipalityName = isSuperAdmin ? null : municipalities[0]?.name ?? null;

  const history = await db.broadcastNotification.findMany({
    where: isSuperAdmin ? {} : { municipalityId: session.user.municipalityId ?? "__none__" },
    orderBy: { createdAt: "desc" },
    take: 25,
    include: {
      municipality: { select: { name: true } },
      actor: { select: { name: true, role: true } },
    },
  });

  return (
    <div className="space-y-6">
      <PageHeader title="إرسال الإشعارات" />
      <BroadcastNotificationForm
        municipalities={municipalities}
        isSuperAdmin={isSuperAdmin}
        forcedMunicipalityName={forcedMunicipalityName}
      />

      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-slate-700">سجل الإشعارات المرسلة</h2>
        {history.length === 0 ? (
          <p className="rounded border border-[var(--gov-border)] bg-white p-4 text-sm text-[var(--gov-muted)]">
            لا توجد إشعارات مرسلة بعد.
          </p>
        ) : (
          <div className="overflow-hidden rounded border border-[var(--gov-border)] bg-white">
            <table className="w-full min-w-[760px] text-sm">
              <thead className="bg-slate-50 text-slate-600">
                <tr>
                  <th className="px-3 py-2 text-start">العنوان</th>
                  <th className="px-3 py-2 text-start">النطاق</th>
                  <th className="px-3 py-2 text-start">النوع</th>
                  <th className="px-3 py-2 text-start">الحالة</th>
                  <th className="px-3 py-2 text-start">المرسل</th>
                  <th className="px-3 py-2 text-start">التاريخ</th>
                </tr>
              </thead>
              <tbody>
                {history.map((row) => (
                  <tr key={row.id} className="border-t border-[var(--gov-border)]">
                    <td className="px-3 py-2">
                      <div className="font-medium text-slate-900">{row.title}</div>
                      <div className="max-w-md truncate text-xs text-slate-500">{row.message}</div>
                    </td>
                    <td className="px-3 py-2">{row.municipality?.name ?? "كل المحافظة"}</td>
                    <td className="px-3 py-2">{roleLabel[row.targetRole] ?? row.targetRole}</td>
                    <td className="px-3 py-2">
                      <Badge className={row.status === "FAILED" ? "border-rose-200 bg-rose-50 text-rose-800" : ""}>
                        {statusLabel[row.status] ?? row.status}
                      </Badge>
                    </td>
                    <td className="px-3 py-2">{row.actor?.name ?? "غير معروف"}</td>
                    <td className="px-3 py-2" dir="ltr">
                      {row.createdAt.toLocaleString("ar-SY")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
