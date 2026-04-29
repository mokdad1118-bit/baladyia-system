import { db } from "@/lib/db";
import { auth } from "@/auth";
import { requireStaffPanelPermission } from "@/lib/admin-guard";
import { UserRole } from "@/generated/prisma/enums";
import { StaffUsersListWithSearch } from "@/components/admin/StaffUsersListWithSearch";

export default async function AdminStaffUsersPage() {
  const s = await auth();
  await requireStaffPanelPermission(s, "users");
  const users = await db.user.findMany({
    where: { role: { in: [UserRole.EMPLOYEE, UserRole.ADMIN] } },
    orderBy: { createdAt: "desc" },
  });
  return (
    <StaffUsersListWithSearch
      users={users.map((u) => ({
        id: u.id,
        name: u.name,
        email: u.email,
        notificationEmail: u.notificationEmail,
        phone: u.phone,
        role: u.role,
        isActive: u.isActive,
        permManageServices: u.permManageServices,
        permManageUsers: u.permManageUsers,
        permViewStats: u.permViewStats,
      }))}
      isFullAdmin={s!.user!.role === UserRole.ADMIN}
      assignablePerms={{
        services: s!.user!.role === UserRole.ADMIN || Boolean(s!.user!.permManageServices),
        users: s!.user!.role === UserRole.ADMIN || Boolean(s!.user!.permManageUsers),
        stats: s!.user!.role === UserRole.ADMIN || Boolean(s!.user!.permViewStats),
      }}
    />
  );
}
