import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { UserRole } from "@/generated/prisma/enums";
import { db } from "@/lib/db";
import { LogoutForm } from "@/components/LogoutForm";

export default async function GasAgentHomePage() {
  const s = await auth();
  if (!s?.user) redirect("/citizen/login?next=/gas-agent");
  if (s.user.role !== UserRole.GAS_AGENT) {
    if (s.user.role === UserRole.ADMIN) redirect("/admin");
    if (s.user.role === UserRole.EMPLOYEE) redirect("/staff");
    redirect("/citizen");
  }

  const me = await db.user.findUnique({
    where: { id: s.user.id },
    select: { name: true, gasArea: true },
  });

  const rows = await db.gasRequest.findMany({
    where: { assignedAgentId: s.user.id },
    orderBy: { createdAt: "desc" },
    take: 500,
  });

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3 border-b border-[var(--gov-border)] pb-4">
        <header>
          <h1 className="text-lg font-bold text-[var(--gov-text)] md:text-xl">لوحة معتمد الغاز</h1>
          <p className="mt-1 text-sm text-[var(--gov-muted)]">
            {me?.name ?? "معتمد غاز"} - المنطقة: <span className="font-semibold">{me?.gasArea ?? "—"}</span>
          </p>
        </header>
        <LogoutForm callbackUrl="/citizen/login" />
      </div>

      {rows.length === 0 ? (
        <div className="gov-card p-10 text-center text-sm text-[var(--gov-muted)]">
          لا توجد طلبات غاز مخصصة لك حالياً.
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
                <th>المنطقة</th>
                <th>تاريخ التقديم</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id}>
                  <td className="font-mono font-semibold text-[var(--gov-primary)]">{r.gasRequestNumber}</td>
                  <td>{r.fullName}</td>
                  <td dir="ltr">{r.phone}</td>
                  <td dir="ltr">{r.nationalId}</td>
                  <td>{r.area}</td>
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
