import Link from "next/link";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { requireStaffPanelPermission } from "@/lib/admin-guard";
import { AdminPageMunicipalityScopeForm } from "@/components/admin/AdminPageMunicipalityScopeForm";
import { AdminInPersonRequestForm } from "@/components/admin/AdminInPersonRequestForm";
import {
  AdminInPersonReturneeRegistrationForm,
  AdminInPersonSocialServiceCaseForm,
} from "@/components/admin/AdminInPersonSocialForms";
import {
  AdminInPersonServicesExportButton,
  type InPersonServiceExportRow,
} from "@/components/admin/AdminInPersonServicesExportButton";
import { staffMunicipalityIdFilter } from "@/lib/municipality-scope";
import { listActiveMunicipalities } from "@/lib/municipalities";
import { isSuperAdminRole } from "@/lib/roles";
import { SocialServiceCategory } from "@/generated/prisma/enums";
import { socialServiceCategoryLabelAr } from "@/lib/social-service-labels";

type Props = { searchParams: Promise<{ municipalityId?: string; serviceId?: string; item?: string; error?: string }> };

const socialServiceOptions = [
  { key: "social:returnees", label: "تسجيل العائدين", category: null },
  { key: `social:${SocialServiceCategory.DIVORCED}`, label: socialServiceCategoryLabelAr[SocialServiceCategory.DIVORCED], category: SocialServiceCategory.DIVORCED },
  { key: `social:${SocialServiceCategory.WIDOWS}`, label: socialServiceCategoryLabelAr[SocialServiceCategory.WIDOWS], category: SocialServiceCategory.WIDOWS },
  { key: `social:${SocialServiceCategory.ORPHANS}`, label: socialServiceCategoryLabelAr[SocialServiceCategory.ORPHANS], category: SocialServiceCategory.ORPHANS },
  { key: `social:${SocialServiceCategory.DISABILITIES}`, label: socialServiceCategoryLabelAr[SocialServiceCategory.DISABILITIES], category: SocialServiceCategory.DISABILITIES },
  { key: `social:${SocialServiceCategory.CHRONIC_DISEASES}`, label: socialServiceCategoryLabelAr[SocialServiceCategory.CHRONIC_DISEASES], category: SocialServiceCategory.CHRONIC_DISEASES },
  { key: `social:${SocialServiceCategory.FAMILY_CENSUS}`, label: socialServiceCategoryLabelAr[SocialServiceCategory.FAMILY_CENSUS], category: SocialServiceCategory.FAMILY_CENSUS },
] as const;

function socialOptionFromKey(key: string) {
  return socialServiceOptions.find((option) => option.key === key) ?? null;
}

export default async function AdminInPersonServicesPage({ searchParams }: Props) {
  const session = await auth();
  await requireStaffPanelPermission(session, "inPerson");
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
    include: { municipality: { select: { id: true, name: true } } },
  });

  const staffMunicipality =
    !isSuperAdmin && "municipalityId" in municipalityFilter
      ? await db.municipality.findUnique({
          where: { id: municipalityFilter.municipalityId },
          select: { id: true, name: true },
        })
      : null;
  const selectedMunicipality = selectedMunicipalityId
    ? (municipalities.find((m) => m.id === selectedMunicipalityId) ??
      (await db.municipality.findUnique({ where: { id: selectedMunicipalityId }, select: { id: true, name: true } })))
    : staffMunicipality;

  const selectedItem = sp.item?.trim() || (sp.serviceId?.trim() ? `city:${sp.serviceId.trim()}` : "");
  const selectedCityServiceId = selectedItem.startsWith("city:") ? selectedItem.slice("city:".length) : "";
  const selectedSocialOption = selectedItem.startsWith("social:") ? socialOptionFromKey(selectedItem) : null;

  const selectedService = selectedCityServiceId
    ? await db.service.findFirst({
        where: { ...municipalityFilter, id: selectedCityServiceId, isActive: true },
        include: {
          documents: { orderBy: { sortOrder: "asc" } },
          municipality: { select: { name: true } },
        },
      })
    : null;

  const exportMunicipalities = isSuperAdmin
    ? selectedMunicipalityId
      ? municipalities.filter((m) => m.id === selectedMunicipalityId)
      : municipalities
    : staffMunicipality
      ? [staffMunicipality]
      : [];
  const exportRows: InPersonServiceExportRow[] = [
    ...services.map((service) => ({
      serviceName: service.name,
      serviceType: "خدمة بلدية",
      municipalityName: service.municipality.name,
    })),
    ...exportMunicipalities.flatMap((municipality) =>
      socialServiceOptions.map((option) => ({
        serviceName: option.label,
        serviceType: "خدمة اجتماعية",
        municipalityName: municipality.name,
      })),
    ),
  ];

  return (
    <div className="space-y-6">
      <header className="gov-page-heading border-b border-[var(--gov-border)] pb-4">
        <h1 className="text-lg font-bold text-[var(--gov-text)] md:text-xl">الخدمات المقدمة حضورياً</h1>
        <p className="mt-1 text-sm text-[var(--gov-muted)]">
          إنشاء طلب نيابة عن المواطن باستخدام نفس الخدمات والأوراق والمرفقات المعرفة في النظام.
        </p>
        <Link
          href={`/admin/services/in-person/completed${selectedMunicipalityId ? `?municipalityId=${encodeURIComponent(selectedMunicipalityId)}` : ""}`}
          className="mt-3 inline-flex min-h-10 items-center rounded border border-[var(--gov-border)] bg-white px-4 text-sm font-semibold text-[var(--gov-primary)] no-underline hover:bg-slate-50"
        >
          الطلبات التي تم تقديمها حضورياً
        </Link>
      </header>

      <AdminPageMunicipalityScopeForm municipalities={municipalities} current={selectedMunicipalityId} />

      <form method="get" className="gov-card flex flex-wrap items-end gap-3 p-4">
        {selectedMunicipalityId ? <input type="hidden" name="municipalityId" value={selectedMunicipalityId} /> : null}
        <div className="min-w-[16rem] flex-1">
          <label className="mb-1.5 block text-sm font-medium text-[var(--gov-text)]">الخدمة</label>
          <select name="item" defaultValue={selectedItem} required className="gov-input w-full px-3 py-2.5 text-sm">
            <option value="">اختر خدمة من الخدمات الحالية</option>
            <optgroup label="خدمات البلدية">
              {services.map((service) => (
                <option key={service.id} value={`city:${service.id}`}>
                  {service.name} - {service.municipality.name}
                </option>
              ))}
            </optgroup>
            <optgroup label="الخدمات الاجتماعية">
              {socialServiceOptions.map((option) => (
                <option key={option.key} value={option.key}>
                  {option.label}
                  {selectedMunicipality?.name ? ` - ${selectedMunicipality.name}` : ""}
                </option>
              ))}
            </optgroup>
          </select>
        </div>
        <button type="submit" className="gov-btn-primary px-5 py-2.5 text-sm font-semibold">
          إنشاء طلب حضوري
        </button>
        <AdminInPersonServicesExportButton rows={exportRows} />
      </form>

      {selectedCityServiceId && !selectedService ? (
        <p className="gov-card border-rose-200 bg-rose-50 p-4 text-sm text-rose-900">الخدمة غير متوفرة ضمن النطاق المحدد.</p>
      ) : null}

      {selectedSocialOption && !selectedMunicipality ? (
        <p className="gov-card border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          يرجى اختيار البلدية أولاً قبل إنشاء طلب خدمة اجتماعية حضوري.
        </p>
      ) : null}

      {selectedService ? <AdminInPersonRequestForm service={selectedService} errorMessage={sp.error} /> : null}
      {selectedSocialOption?.key === "social:returnees" && selectedMunicipality ? (
        <AdminInPersonReturneeRegistrationForm
          municipalityId={selectedMunicipality.id}
          municipalityName={selectedMunicipality.name}
        />
      ) : null}
      {selectedSocialOption?.category && selectedMunicipality ? (
        <AdminInPersonSocialServiceCaseForm
          municipalityId={selectedMunicipality.id}
          municipalityName={selectedMunicipality.name}
          category={selectedSocialOption.category}
        />
      ) : null}
    </div>
  );
}
