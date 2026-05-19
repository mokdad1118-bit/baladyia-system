"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { isSuperAdminRole } from "@/lib/roles";
import { z } from "zod";
import { writeOperationLog } from "@/lib/operation-log";

const MUNICIPALITY_PATHS = [
  "/admin/municipalities",
  "/admin/municipalities/compare",
  "/admin",
  "/citizen/register",
] as const;

function revalidateMunicipalityViews() {
  for (const p of MUNICIPALITY_PATHS) revalidatePath(p);
}

async function requireSuperAdminAction() {
  const s = await auth();
  if (!s?.user || !isSuperAdminRole(s.user.role)) {
    return { error: "غير مصرّح — هذه الصفحة لمشرف المحافظة فقط" as const };
  }
  return { session: s };
}

const codeSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(2, "المعرّف قصير جداً")
  .max(48, "المعرّف طويل جداً")
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "المعرّف: أحرف إنجليزية صغيرة وأرقام وشرطات فقط");

const nameSchema = z.string().trim().min(2, "اسم البلدية مطلوب").max(120, "الاسم طويل جداً");

export async function createMunicipality(
  _prev: { error?: string; ok?: true } | undefined,
  formData: FormData,
): Promise<{ error?: string; ok?: true }> {
  const gate = await requireSuperAdminAction();
  if ("error" in gate) return { error: gate.error };

  const nameParsed = nameSchema.safeParse(String(formData.get("name") ?? ""));
  const codeParsed = codeSchema.safeParse(String(formData.get("code") ?? ""));
  const sortRaw = String(formData.get("sortOrder") ?? "").trim();
  const sortOrder = sortRaw ? Number(sortRaw) : NaN;

  if (!nameParsed.success) return { error: nameParsed.error.issues[0]?.message ?? "اسم غير صالح" };
  if (!codeParsed.success) return { error: codeParsed.error.issues[0]?.message ?? "معرّف غير صالح" };

  let order = sortOrder;
  if (!Number.isFinite(order)) {
    const max = await db.municipality.aggregate({ _max: { sortOrder: true } });
    order = (max._max.sortOrder ?? 0) + 10;
  }

  const exists = await db.municipality.findUnique({ where: { code: codeParsed.data } });
  if (exists) return { error: "معرّف البلدية مستخدم مسبقاً" };

  const created = await db.municipality.create({
    data: {
      name: nameParsed.data,
      code: codeParsed.data,
      sortOrder: Math.round(order),
      governorate: "درعا",
      isActive: true,
    },
  });
  await writeOperationLog({
    session: gate.session,
    municipalityId: created.id,
    action: "CREATE",
    module: "MUNICIPALITIES",
    title: "إضافة بلدية",
    description: `تمت إضافة بلدية: ${created.name}`,
    entityType: "MUNICIPALITY",
    entityId: created.id,
    metadata: created,
  });

  revalidateMunicipalityViews();
  return { ok: true };
}

export async function updateMunicipality(
  _prev: { error?: string; ok?: true } | undefined,
  formData: FormData,
): Promise<{ error?: string; ok?: true }> {
  const gate = await requireSuperAdminAction();
  if ("error" in gate) return { error: gate.error };

  const id = String(formData.get("id") ?? "").trim();
  if (!id) return { error: "معرّف البلدية مفقود" };

  const nameParsed = nameSchema.safeParse(String(formData.get("name") ?? ""));
  const sortRaw = String(formData.get("sortOrder") ?? "").trim();
  const sortOrder = Number(sortRaw);
  if (!nameParsed.success) return { error: nameParsed.error.issues[0]?.message ?? "اسم غير صالح" };
  if (!Number.isFinite(sortOrder)) return { error: "ترتيب العرض غير صالح" };

  const row = await db.municipality.findUnique({ where: { id } });
  if (!row) return { error: "البلدية غير موجودة" };

  const updated = await db.municipality.update({
    where: { id },
    data: {
      name: nameParsed.data,
      sortOrder: Math.round(sortOrder),
    },
  });
  await writeOperationLog({
    session: gate.session,
    municipalityId: id,
    action: "UPDATE",
    module: "MUNICIPALITIES",
    title: "تعديل بلدية",
    description: `تم تعديل بلدية: ${updated.name}`,
    entityType: "MUNICIPALITY",
    entityId: id,
    metadata: { before: row, after: updated },
  });

  revalidateMunicipalityViews();
  return { ok: true };
}

export async function setMunicipalityActive(
  municipalityId: string,
  isActive: boolean,
): Promise<{ error?: string; ok?: true }> {
  const gate = await requireSuperAdminAction();
  if ("error" in gate) return { error: gate.error };

  const row = await db.municipality.findUnique({ where: { id: municipalityId } });
  if (!row) return { error: "البلدية غير موجودة" };

  if (!isActive && row.code === "bosra-sham") {
    return { error: "لا يمكن تعطيل البلدية الافتراضية المستخدمة لترحيل البيانات القديمة" };
  }

  await db.municipality.update({
    where: { id: municipalityId },
    data: { isActive },
  });
  await writeOperationLog({
    session: gate.session,
    municipalityId,
    action: isActive ? "ACTIVATE" : "DEACTIVATE",
    module: "MUNICIPALITIES",
    title: isActive ? "تفعيل بلدية" : "تعطيل بلدية",
    description: `${isActive ? "تم تفعيل" : "تم تعطيل"} بلدية: ${row.name}`,
    entityType: "MUNICIPALITY",
    entityId: municipalityId,
    metadata: { before: row, isActive },
  });

  revalidateMunicipalityViews();
  return { ok: true };
}

export async function deleteMunicipality(
  municipalityId: string,
): Promise<{ error?: string; ok?: true }> {
  const gate = await requireSuperAdminAction();
  if ("error" in gate) return { error: gate.error };

  const id = municipalityId.trim();
  if (!id) return { error: "معرّف البلدية مفقود" };

  const row = await db.municipality.findUnique({
    where: { id },
    include: {
      _count: {
        select: {
          users: true,
          departments: true,
          services: true,
          requests: true,
          citizenFeedbacks: true,
          gasRequests: true,
          returneeRegistrations: true,
          socialServiceCases: true,
          notifications: true,
          pendingCitizenRegistrations: true,
        },
      },
    },
  });
  if (!row) return { error: "البلدية غير موجودة" };
  if (row.code === "bosra-sham") {
    return { error: "لا يمكن حذف البلدية الافتراضية المستخدمة لترحيل البيانات القديمة" };
  }

  const total =
    row._count.users +
    row._count.departments +
    row._count.services +
    row._count.requests +
    row._count.citizenFeedbacks +
    row._count.gasRequests +
    row._count.returneeRegistrations +
    row._count.socialServiceCases +
    row._count.notifications +
    row._count.pendingCitizenRegistrations;

  if (total > 0) {
    return {
      error:
        "لا يمكن حذف بلدية لديها بيانات مرتبطة. عطّل البلدية أولاً أو انقل/احذف البيانات التابعة لها من التفاصيل.",
    };
  }

  await writeOperationLog({
    session: gate.session,
    municipalityId: id,
    action: "DELETE",
    module: "MUNICIPALITIES",
    title: "حذف بلدية",
    description: `تم حذف بلدية: ${row.name}`,
    entityType: "MUNICIPALITY",
    entityId: id,
    metadata: { id: row.id, name: row.name, code: row.code },
  });
  await db.municipality.delete({ where: { id } });
  revalidateMunicipalityViews();
  return { ok: true };
}
