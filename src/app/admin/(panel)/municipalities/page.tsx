import { auth } from "@/auth";
import { db } from "@/lib/db";
import { requireSuperAdminPanel } from "@/lib/admin-guard";
import { UserRole } from "@/generated/prisma/enums";
import {
  MunicipalitiesManagePanel,
  type MunicipalityAdminRow,
} from "@/components/admin/MunicipalitiesManagePanel";

export default async function AdminMunicipalitiesPage() {
  const s = await auth();
  await requireSuperAdminPanel(s);

  const municipalities = await db.municipality.findMany({
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    include: {
      _count: {
        select: {
          users: { where: { role: UserRole.CITIZEN } },
          requests: true,
        },
      },
    },
  });

  const rows: MunicipalityAdminRow[] = municipalities.map((m) => ({
    id: m.id,
    name: m.name,
    code: m.code,
    sortOrder: m.sortOrder,
    isActive: m.isActive,
    governorate: m.governorate,
    citizens: m._count.users,
    requests: m._count.requests,
  }));

  return <MunicipalitiesManagePanel rows={rows} />;
}
