"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { FileKind } from "@/generated/prisma/enums";
import { staffCanManageServices } from "@/lib/staff-permissions";
import {
  assertStaffCanAccessMunicipality,
  resolveMunicipalityIdForStaffCreate,
  staffMunicipalityIdFilter,
} from "@/lib/municipality-scope";
import { writeOperationLog } from "@/lib/operation-log";

function parseFileKind(v: string | File | null | undefined): FileKind | null {
  const s = String(v ?? "");
  if (s === "IMAGE" || s === "PDF" || s === "ANY") return s;
  return null;
}

async function assertCanManageService(serviceId: string) {
  const s = await auth();
  if (!staffCanManageServices(s)) return { error: "غير مصرّح" as const };
  const service = await db.service.findFirst({
    where: { id: serviceId, ...staffMunicipalityIdFilter(s) },
    select: { municipalityId: true },
  });
  if (!service) return { error: "الخدمة غير موجودة أو خارج نطاق بلديتك" as const };
  try {
    assertStaffCanAccessMunicipality(s, service.municipalityId);
  } catch {
    return { error: "غير مصرّح" as const };
  }
  return { ok: true as const, session: s };
}

export async function upsertService(
  _p: { error?: string } | undefined,
  formData: FormData,
) {
  const s = await auth();
  if (!staffCanManageServices(s)) {
    return { error: "غير مصرّح" };
  }

  const id = (formData.get("id") as string | null)?.trim() || null;
  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "");
  const price = String(formData.get("price") ?? "0").trim() || "0";
  if (!name) return { error: "اسم الخدمة مطلوب" };
  if (!/^\d+(\.\d{1,2})?$/.test(price)) return { error: "تنسيق السعر غير صالح" };

  const docNames = formData.getAll("docName[]");
  const docRequired = formData.getAll("docRequired[]");
  const docType = formData.getAll("docType[]");
  const documents: { name: string; isRequired: boolean; fileType: FileKind }[] = [];
  for (let i = 0; i < docNames.length; i++) {
    const n = String(docNames[i] ?? "").trim();
    if (!n) continue;
    const ft = parseFileKind(docType[i] as string);
    if (!ft) continue;
    documents.push({
      name: n,
      isRequired: String(docRequired[i] ?? "0") === "1",
      fileType: ft,
    });
  }

  if (id) {
    const access = await assertCanManageService(id);
    if ("error" in access) return { error: access.error };
    const before = await db.service.findUnique({
      where: { id },
      select: { id: true, municipalityId: true, name: true, description: true, price: true },
    });
    await db.serviceDocument.deleteMany({ where: { serviceId: id } });
    await db.service.update({
      where: { id },
      data: {
        name,
        description,
        price,
        documents: {
          create: documents.map((d, idx) => ({
            name: d.name,
            isRequired: d.isRequired,
            fileType: d.fileType,
            sortOrder: idx,
          })),
        },
      },
    });
    await writeOperationLog({
      session: s,
      municipalityId: before?.municipalityId,
      action: "UPDATE",
      module: "SERVICES",
      title: "تعديل خدمة",
      description: `تم تعديل الخدمة: ${name}`,
      entityType: "SERVICE",
      entityId: id,
      metadata: { before, after: { name, description, price, documents } },
    });
  } else {
    const municipalityId = resolveMunicipalityIdForStaffCreate(s, formData);
    if (!municipalityId) return { error: "يرجى اختيار البلدية" };
    try {
      assertStaffCanAccessMunicipality(s, municipalityId);
    } catch {
      return { error: "غير مصرّح" };
    }
    const created = await db.service.create({
      data: {
        municipalityId,
        name,
        description,
        price,
        documents: {
          create: documents.map((d, idx) => ({
            name: d.name,
            isRequired: d.isRequired,
            fileType: d.fileType,
            sortOrder: idx,
          })),
        },
      },
    });
    await writeOperationLog({
      session: s,
      municipalityId,
      action: "CREATE",
      module: "SERVICES",
      title: "إضافة خدمة",
      description: `تمت إضافة الخدمة: ${name}`,
      entityType: "SERVICE",
      entityId: created.id,
      metadata: { name, description, price, documents },
    });
  }
  revalidatePath("/admin/services");
  revalidatePath("/services");
  return { error: undefined };
}

export async function deleteService(serviceId: string) {
  const access = await assertCanManageService(serviceId);
  if ("error" in access) return { error: access.error };
  const service = await db.service.findUnique({
    where: { id: serviceId },
    select: { id: true, municipalityId: true, name: true },
  });
  await db.service.update({
    where: { id: serviceId },
    data: { isActive: false },
  });
  await writeOperationLog({
    session: access.session,
    municipalityId: service?.municipalityId,
    action: "DEACTIVATE",
    module: "SERVICES",
    title: "تعطيل خدمة",
    description: `تم تعطيل الخدمة: ${service?.name ?? serviceId}`,
    entityType: "SERVICE",
    entityId: serviceId,
    metadata: service,
  });
  revalidatePath("/admin/services");
  revalidatePath("/services");
  return { ok: true as const };
}

export async function deleteServiceByForm(
  _p: { error?: string } | undefined,
  formData: FormData,
) {
  return deleteService(String(formData.get("serviceId") ?? ""));
}
