import { db } from "@/lib/db";
import { auth } from "@/auth";
import { requireStaffPanelPermission } from "@/lib/admin-guard";
import { StaffUsersListWithSearch } from "@/components/admin/StaffUsersListWithSearch";
import { staffStaffUserWhere } from "@/lib/municipality-scope";
import { hasFullAdminPrivileges, isSuperAdminRole } from "@/lib/roles";
import { listActiveMunicipalities } from "@/lib/municipalities";

export default async function AdminStaffUsersPage() {
  const s = await auth();
  await requireStaffPanelPermission(s, "users");
  const [users, municipalities] = await Promise.all([
    db.user.findMany({
      where: staffStaffUserWhere(s),
      orderBy: { createdAt: "desc" },
    }),
    isSuperAdminRole(s!.user!.role) ? listActiveMunicipalities() : Promise.resolve([]),
  ]);
  const elevated = hasFullAdminPrivileges(s!.user!.role);
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
      municipalities={municipalities}
      isSuperAdmin={isSuperAdminRole(s!.user!.role)}
      isFullAdmin={elevated}
      assignablePerms={{
        services: elevated || Boolean(s!.user!.permManageServices),
        users: elevated || Boolean(s!.user!.permManageUsers),
        stats: elevated || Boolean(s!.user!.permViewStats),
      }}
    />
  );
}
