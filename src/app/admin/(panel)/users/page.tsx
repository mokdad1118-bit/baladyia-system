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
        permViewRequests: u.permViewRequests,
        permManageGas: u.permManageGas,
        permManageSocialServices: u.permManageSocialServices,
        permManageCitizenFeedback: u.permManageCitizenFeedback,
        permViewCitizens: u.permViewCitizens,
        permViewOperationLog: u.permViewOperationLog,
        permManageServices: u.permManageServices,
        permManageUsers: u.permManageUsers,
        permViewStats: u.permViewStats,
      }))}
      municipalities={municipalities}
      isSuperAdmin={isSuperAdminRole(s!.user!.role)}
      isFullAdmin={elevated}
      assignablePerms={{
        requests: elevated || Boolean(s!.user!.permViewRequests),
        gas: elevated || Boolean(s!.user!.permManageGas),
        social: elevated || Boolean(s!.user!.permManageSocialServices),
        feedback: elevated || Boolean(s!.user!.permManageCitizenFeedback),
        citizens: elevated || Boolean(s!.user!.permViewCitizens),
        operationLog: elevated || Boolean(s!.user!.permViewOperationLog),
        services: elevated || Boolean(s!.user!.permManageServices),
        users: elevated || Boolean(s!.user!.permManageUsers),
        stats: elevated || Boolean(s!.user!.permViewStats),
      }}
    />
  );
}
