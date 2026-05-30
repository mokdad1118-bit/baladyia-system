import { db } from "@/lib/db";
import { auth } from "@/auth";
import { requireStaffPanelPermission } from "@/lib/admin-guard";
import { CitizensListWithSearch } from "@/components/admin/CitizensListWithSearch";
import { staffCitizenUserWhere } from "@/lib/municipality-scope";
import { hasFullAdminPrivileges } from "@/lib/roles";

/** حسابات المواطنين فقط — منفصلة عن صفحة حسابات الموظفين */
export default async function AdminCitizensPage() {
  const s = await auth();
  await requireStaffPanelPermission(s, "citizens");
  const isAdmin = hasFullAdminPrivileges(s!.user!.role);

  const citizens = await db.user.findMany({
    where: staffCitizenUserWhere(s),
    orderBy: { createdAt: "desc" },
    include: { municipality: { select: { name: true } } },
  });

  return (
    <CitizensListWithSearch
      isAdmin={isAdmin}
      citizens={citizens.map((u) => ({
        id: u.id,
        name: u.name,
        email: u.email,
        notificationEmail: u.notificationEmail,
        phone: u.phone,
        nationalId: u.nationalId,
        municipalityName: u.municipality?.name ?? null,
        isVerified: u.isVerified,
        role: u.role,
        isActive: u.isActive,
      }))}
    />
  );
}
