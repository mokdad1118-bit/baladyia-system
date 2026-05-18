import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { UserRole } from "@/generated/prisma/enums";
import { db } from "@/lib/db";
import { LogoutForm } from "@/components/LogoutForm";
import { GasAgentRequestsTableWithSearch } from "@/components/gas-agent/GasAgentRequestsTableWithSearch";

export default async function GasAgentHomePage() {
  const s = await auth();
  if (!s?.user) redirect("/citizen/welcome?next=/gas-agent");
  if (s.user.role !== UserRole.GAS_AGENT) {
    if (s.user.role === UserRole.SUPER_ADMIN || s.user.role === UserRole.MUNICIPALITY_ADMIN) redirect("/admin");
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
        <LogoutForm callbackUrl="/citizen/welcome" />
      </div>

      <GasAgentRequestsTableWithSearch
        rows={rows.map((r) => ({
          id: r.id,
          gasRequestNumber: r.gasRequestNumber,
          fullName: r.fullName,
          phone: r.phone,
          nationalId: r.nationalId,
          area: r.area,
          createdAt: r.createdAt.toISOString(),
          isCompleted: r.isCompleted,
          completedAt: r.completedAt?.toISOString() ?? null,
        }))}
      />
    </div>
  );
}
