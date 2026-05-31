import { db } from "@/lib/db";
import { auth } from "@/auth";
import { requireStaffPanelPermission } from "@/lib/admin-guard";
import { StaffUsersListWithSearch } from "@/components/admin/StaffUsersListWithSearch";
import { staffStaffUserWhere } from "@/lib/municipality-scope";
import { hasFullAdminPrivileges, isSuperAdminRole } from "@/lib/roles";
import { listActiveMunicipalities } from "@/lib/municipalities";
import { UserRole } from "@/generated/prisma/enums";
import { AdminPageMunicipalityScopeForm } from "@/components/admin/AdminPageMunicipalityScopeForm";

type Props = { searchParams: Promise<{ municipalityId?: string }> };

export default async function AdminStaffUsersPage({ searchParams }: Props) {
  const s = await auth();
  await requireStaffPanelPermission(s, "users");
  const isSuperAdmin = isSuperAdminRole(s!.user!.role);
  const sp = await searchParams;
  const selectedMunicipalityId =
    isSuperAdmin && sp.municipalityId && sp.municipalityId !== "__ALL__" ? sp.municipalityId : "";
  const [users, municipalities] = await Promise.all([
    db.user.findMany({
      where: isSuperAdmin
        ? {
            role: { in: [UserRole.SUPER_ADMIN, UserRole.MUNICIPALITY_ADMIN, UserRole.EMPLOYEE] },
            ...(selectedMunicipalityId ? { municipalityId: selectedMunicipalityId } : {}),
          }
        : staffStaffUserWhere(s),
      orderBy: { createdAt: "desc" },
      include: { municipality: { select: { name: true } } },
    }),
    isSuperAdmin ? listActiveMunicipalities() : Promise.resolve([]),
  ]);
  const elevated = hasFullAdminPrivileges(s!.user!.role);
  return (
    <>
      <AdminPageMunicipalityScopeForm municipalities={municipalities} current={selectedMunicipalityId} />
      <StaffUsersListWithSearch
        users={users.map((u) => ({
          id: u.id,
          name: u.name,
          email: u.email,
          notificationEmail: u.notificationEmail,
          phone: u.phone,
          municipalityName: u.municipality?.name ?? null,
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
        isSuperAdmin={isSuperAdmin}
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
    </>
  );
}
