"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { FileKind } from "@/generated/prisma/enums";
import { staffCanManageServices } from "@/lib/staff-permissions";

function parseFileKind(v: string | File | null | undefined): FileKind | null {
  const s = String(v ?? "");
  if (s === "IMAGE" || s === "PDF" || s === "ANY") return s;
  return null;
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
  const documents: { name: string; isRequired: boolean; fileType: FileKind }[] =
    [];
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
  } else {
    await db.service.create({
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
  }
  revalidatePath("/admin/services");
  revalidatePath("/services");
  return { error: undefined };
}

export async function deleteService(serviceId: string) {
  const s = await auth();
  if (!staffCanManageServices(s)) {
    return { error: "غير مصرّح" };
  }
  await db.service.update({
    where: { id: serviceId },
    data: { isActive: false },
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
