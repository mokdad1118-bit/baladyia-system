"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { isSuperAdminRole } from "@/lib/roles";
import { z } from "zod";

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

  await db.municipality.create({
    data: {
      name: nameParsed.data,
      code: codeParsed.data,
      sortOrder: Math.round(order),
      governorate: "درعا",
      isActive: true,
    },
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

  await db.municipality.update({
    where: { id },
    data: {
      name: nameParsed.data,
      sortOrder: Math.round(sortOrder),
    },
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

  revalidateMunicipalityViews();
  return { ok: true };
}
