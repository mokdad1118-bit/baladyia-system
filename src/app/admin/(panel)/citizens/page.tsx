import { db } from "@/lib/db";
import { auth } from "@/auth";
import { requireAdminPanel } from "@/lib/admin-guard";
import { UserRole } from "@/generated/prisma/enums";
import { CitizensListWithSearch } from "@/components/admin/CitizensListWithSearch";

/** حسابات المواطنين فقط — منفصلة عن صفحة حسابات الموظفين */
export default async function AdminCitizensPage() {
  const s = await auth();
  await requireAdminPanel(s);
  const isAdmin = s!.user!.role === UserRole.ADMIN;

  const citizens = await db.user.findMany({
    where: { role: UserRole.CITIZEN },
    orderBy: { createdAt: "desc" },
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
        isVerified: u.isVerified,
        role: u.role,
        isActive: u.isActive,
      }))}
    />
  );
}
