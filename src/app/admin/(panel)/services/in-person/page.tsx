import { auth } from "@/auth";
import { db } from "@/lib/db";
import { requireStaffPanelPermission } from "@/lib/admin-guard";
import { AdminPageMunicipalityScopeForm } from "@/components/admin/AdminPageMunicipalityScopeForm";
import { AdminInPersonRequestForm } from "@/components/admin/AdminInPersonRequestForm";
import { staffMunicipalityIdFilter } from "@/lib/municipality-scope";
import { listActiveMunicipalities } from "@/lib/municipalities";
import { isSuperAdminRole } from "@/lib/roles";

type Props = { searchParams: Promise<{ municipalityId?: string; serviceId?: string }> };

export default async function AdminInPersonServicesPage({ searchParams }: Props) {
  const session = await auth();
  await requireStaffPanelPermission(session, "services");
  const sp = await searchParams;
  const isSuperAdmin = session?.user ? isSuperAdminRole(session.user.role) : false;
  const selectedMunicipalityId =
    isSuperAdmin && sp.municipalityId && sp.municipalityId !== "__ALL__" ? sp.municipalityId : "";
  const municipalityFilter = isSuperAdmin
    ? selectedMunicipalityId
      ? { municipalityId: selectedMunicipalityId }
      : {}
    : staffMunicipalityIdFilter(session);
  const municipalities = isSuperAdmin ? await listActiveMunicipalities() : [];

  const services = await db.service.findMany({
    where: { ...municipalityFilter, isActive: true },
    orderBy: [{ municipality: { sortOrder: "asc" } }, { name: "asc" }],
    include: { municipality: { select: { name: true } } },
  });

  const selectedServiceId = sp.serviceId?.trim() || "";
  const selectedService = selectedServiceId
    ? await db.service.findFirst({
        where: { ...municipalityFilter, id: selectedServiceId, isActive: true },
        include: {
          documents: { orderBy: { sortOrder: "asc" } },
          municipality: { select: { name: true } },
        },
      })
    : null;

  return (
    <div className="space-y-6">
      <header className="gov-page-heading border-b border-[var(--gov-border)] pb-4">
        <h1 className="text-lg font-bold text-[var(--gov-text)] md:text-xl">الخدمات المقدمة حضورياً</h1>
        <p className="mt-1 text-sm text-[var(--gov-muted)]">
          إنشاء طلب نيابة عن المواطن باستخدام نفس الخدمات والأوراق المعرفة في النظام.
        </p>
      </header>

      <AdminPageMunicipalityScopeForm municipalities={municipalities} current={selectedMunicipalityId} />

      <form method="get" className="gov-card flex flex-wrap items-end gap-3 p-4">
        {selectedMunicipalityId ? <input type="hidden" name="municipalityId" value={selectedMunicipalityId} /> : null}
        <div className="min-w-[16rem] flex-1">
          <label className="mb-1.5 block text-sm font-medium text-[var(--gov-text)]">الخدمة</label>
          <select name="serviceId" defaultValue={selectedServiceId} required className="gov-input w-full px-3 py-2.5 text-sm">
            <option value="">اختر خدمة من الخدمات الحالية</option>
            {services.map((service) => (
              <option key={service.id} value={service.id}>
                {service.name} - {service.municipality.name}
              </option>
            ))}
          </select>
        </div>
        <button type="submit" className="gov-btn-primary px-5 py-2.5 text-sm font-semibold">
          إنشاء طلب حضوري
        </button>
      </form>

      {selectedServiceId && !selectedService ? (
        <p className="gov-card border-rose-200 bg-rose-50 p-4 text-sm text-rose-900">الخدمة غير متوفرة ضمن النطاق المحدد.</p>
      ) : null}

      {selectedService ? <AdminInPersonRequestForm service={selectedService} /> : null}
    </div>
  );
}
