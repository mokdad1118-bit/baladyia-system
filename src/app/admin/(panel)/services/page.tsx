import { db } from "@/lib/db";
import { auth } from "@/auth";
import { requireStaffPanelPermission } from "@/lib/admin-guard";
import { ServicesListWithSearch } from "@/components/admin/ServicesListWithSearch";
import { staffMunicipalityIdFilter } from "@/lib/municipality-scope";
import { AdminPageMunicipalityScopeForm } from "@/components/admin/AdminPageMunicipalityScopeForm";
import { listActiveMunicipalities } from "@/lib/municipalities";
import { isSuperAdminRole } from "@/lib/roles";

type Props = { searchParams: Promise<{ municipalityId?: string }> };

export default async function AdminServicesPage({ searchParams }: Props) {
  const s = await auth();
  await requireStaffPanelPermission(s, "services");
  const sp = await searchParams;
  const isSuperAdmin = s?.user ? isSuperAdminRole(s.user.role) : false;
  const selectedMunicipalityId =
    isSuperAdmin && sp.municipalityId && sp.municipalityId !== "__ALL__" ? sp.municipalityId : "";
  const municipalities = isSuperAdmin ? await listActiveMunicipalities() : [];
  const list = await db.service.findMany({
    where: isSuperAdmin ? (selectedMunicipalityId ? { municipalityId: selectedMunicipalityId } : {}) : staffMunicipalityIdFilter(s),
    orderBy: { createdAt: "desc" },
  });
  return (
    <>
      <AdminPageMunicipalityScopeForm municipalities={municipalities} current={selectedMunicipalityId} />
      <ServicesListWithSearch
        services={list.map((s) => ({
          id: s.id,
          name: s.name,
          price: String(s.price),
          isActive: s.isActive,
        }))}
        newHref="/admin/services/new"
        editHrefPrefix="/admin/services"
      />
    </>
  );
}
