import { headers } from "next/headers";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { requireStaffPanelPermission } from "@/lib/admin-guard";
import { staffMunicipalityIdFilter } from "@/lib/municipality-scope";
import { listActiveMunicipalities } from "@/lib/municipalities";
import { isSuperAdminRole } from "@/lib/roles";
import { AdminPageMunicipalityScopeForm } from "@/components/admin/AdminPageMunicipalityScopeForm";
import { AdminInPersonCompletedRequestsList } from "@/components/admin/AdminInPersonCompletedRequestsList";
import { requestExportBaseUrl } from "@/lib/request-export-base-url";

type Props = { searchParams: Promise<{ municipalityId?: string; success?: string; no?: string }> };

export default async function AdminInPersonCompletedRequestsPage({ searchParams }: Props) {
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
  const baseUrl = requestExportBaseUrl(await headers());
  const backHref = selectedMunicipalityId
    ? `/admin/services/in-person?municipalityId=${encodeURIComponent(selectedMunicipalityId)}`
    : "/admin/services/in-person";

  const requests = await db.request.findMany({
    where: {
      ...municipalityFilter,
      source: "in_person",
    },
    orderBy: { createdAt: "desc" },
    take: 300,
    include: {
      municipality: { select: { name: true } },
      service: { select: { name: true } },
      citizen: { select: { name: true, nationalId: true, phone: true, notificationEmail: true } },
      files: {
        orderBy: { createdAt: "asc" },
        include: { serviceDocument: { select: { name: true } } },
      },
      notes: {
        orderBy: { createdAt: "desc" },
        include: { author: { select: { name: true } } },
      },
    },
  });

  const root = baseUrl.replace(/\/$/, "");
  const rows = requests.map((request) => ({
    id: request.id,
    requestNumber: request.requestNumber,
    inPersonNumber: request.requestNumber.replace(/^REQ-/, "INP-"),
    citizenName: request.submittedFullName || request.citizen.name,
    nationalId: request.citizen.nationalId ?? "",
    phone: request.submittedPhone || request.citizen.phone || "",
    notificationEmail: request.submittedNotificationEmail || request.citizen.notificationEmail || "",
    municipalityName: request.municipality.name,
    serviceName: request.service.name,
    status: request.status,
    createdAt: request.createdAt.toISOString(),
    detailHref: `${root}/admin/requests/${request.id}`,
    files: request.files.map((file) => ({
      id: file.id,
      documentName: file.serviceDocument.name,
      originalName: file.originalName,
      href: `${root}/api/request-files/${file.id}`,
      mimeType: file.mimeType,
      size: file.size,
    })),
    notes: request.notes.map((note) => ({
      id: note.id,
      body: note.body,
      authorName: note.author.name,
      createdAt: note.createdAt.toISOString(),
    })),
  }));

  return (
    <>
      <AdminPageMunicipalityScopeForm municipalities={municipalities} current={selectedMunicipalityId} />
      <AdminInPersonCompletedRequestsList
        rows={rows}
        successNumber={sp.success === "1" ? (sp.no ?? "") : ""}
        backHref={backHref}
      />
    </>
  );
}
