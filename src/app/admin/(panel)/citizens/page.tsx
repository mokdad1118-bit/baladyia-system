import { db } from "@/lib/db";
import { auth } from "@/auth";
import { requireStaffPanelPermission } from "@/lib/admin-guard";
import { CitizensListWithSearch } from "@/components/admin/CitizensListWithSearch";
import { staffCitizenUserWhere } from "@/lib/municipality-scope";
import { hasFullAdminPrivileges, isSuperAdminRole } from "@/lib/roles";
import { listActiveMunicipalities } from "@/lib/municipalities";
import { AdminPageMunicipalityScopeForm } from "@/components/admin/AdminPageMunicipalityScopeForm";
import { UserRole } from "@/generated/prisma/enums";

/** حسابات المواطنين فقط — منفصلة عن صفحة حسابات الموظفين */
type Props = { searchParams: Promise<{ municipalityId?: string }> };

export default async function AdminCitizensPage({ searchParams }: Props) {
  const s = await auth();
  await requireStaffPanelPermission(s, "citizens");
  const isAdmin = hasFullAdminPrivileges(s!.user!.role);
  const isSuperAdmin = isSuperAdminRole(s!.user!.role);
  const sp = await searchParams;
  const selectedMunicipalityId =
    isSuperAdmin && sp.municipalityId && sp.municipalityId !== "__ALL__" ? sp.municipalityId : "";

  const [citizens, municipalities] = await Promise.all([
    db.user.findMany({
      where:
        isSuperAdmin
          ? { role: UserRole.CITIZEN, ...(selectedMunicipalityId ? { municipalityId: selectedMunicipalityId } : {}) }
          : staffCitizenUserWhere(s),
      orderBy: { createdAt: "desc" },
      include: { municipality: { select: { name: true } } },
    }),
    isSuperAdmin ? listActiveMunicipalities() : Promise.resolve([]),
  ]);

  return (
    <>
      <AdminPageMunicipalityScopeForm municipalities={municipalities} current={selectedMunicipalityId} />
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
    </>
  );
}
