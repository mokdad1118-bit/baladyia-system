import { auth } from "@/auth";
import { db } from "@/lib/db";
import { UserRole } from "@/generated/prisma/enums";
import { AdminMunicipalityScopeForm } from "@/components/admin/AdminMunicipalityScopeForm";

/** لمشرف المحافظة: اختيار بلدية للتصفية أو عرض الكل */
export async function AdminSuperMunicipalitySwitcher() {
  const s = await auth();
  if (!s?.user || s.user.role !== UserRole.SUPER_ADMIN) return null;
  const municipalities = await db.municipality.findMany({
    where: { isActive: true },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    select: { id: true, name: true },
  });
  const current = s.user.activeMunicipalityId?.trim() ?? "";
  return <AdminMunicipalityScopeForm municipalities={municipalities} current={current} />;
}

export async function AdminCurrentMunicipalityLabel() {
  const s = await auth();
  if (!s?.user) return null;
  let label: string | null = null;
  if (s.user.role === UserRole.SUPER_ADMIN) {
    const id = s.user.activeMunicipalityId?.trim();
    if (!id) label = "كل بلديات محافظة درعا";
    else {
      const m = await db.municipality.findFirst({ where: { id }, select: { name: true } });
      label = m ? `البلدية: ${m.name}` : null;
    }
  } else if (s.user.municipalityId) {
    const m = await db.municipality.findFirst({
      where: { id: s.user.municipalityId },
      select: { name: true },
    });
    label = m ? `البلدية: ${m.name}` : null;
  }
  if (!label) return null;
  return (
    <p className="mb-2 text-xs font-medium text-[var(--gov-muted)] md:text-sm" dir="rtl">
      {label}
    </p>
  );
}
