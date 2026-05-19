"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { hashPassword } from "@/lib/password";
import { UserRole } from "@/generated/prisma/enums";
import { digitsOnly, normalizeCitizenPhoneForStorage } from "@/lib/phone";
import { isSuperAdminRole } from "@/lib/roles";
import { assertStaffCanAccessMunicipality } from "@/lib/municipality-scope";
import { staffCanManageGas } from "@/lib/staff-permissions";
import { writeOperationLog } from "@/lib/operation-log";

export type CreateGasAgentResult =
  | { ok: true; message: string }
  | { ok: false; error: string };

export type UpdateGasAgentResult =
  | { ok: true; message: string }
  | { ok: false; error: string };

export async function createGasAgentAction(formData: FormData): Promise<CreateGasAgentResult> {
  const s = await auth();
  if (!s?.user || !staffCanManageGas(s)) {
    return { ok: false, error: "غير مصرّح" };
  }

  const municipalityId = isSuperAdminRole(s.user.role)
    ? String(formData.get("municipalityId") ?? "").trim()
    : (s.user.municipalityId ?? "").trim();
  if (!municipalityId) {
    return { ok: false, error: "يرجى تحديد البلدية." };
  }
  try {
    assertStaffCanAccessMunicipality(s, municipalityId);
  } catch {
    return { ok: false, error: "غير مصرّح" };
  }

  const name = String(formData.get("name") ?? "").trim();
  const phoneRaw = String(formData.get("phone") ?? "").trim();
  const area = String(formData.get("area") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (name.length < 3) return { ok: false, error: "اسم المعتمد يجب أن يكون 3 أحرف على الأقل." };
  if (area.length < 2) return { ok: false, error: "يرجى إدخال المنطقة المخصصة." };
  if (password.length < 6) return { ok: false, error: "كلمة المرور 6 أحرف على الأقل." };

  const phoneDigits = digitsOnly(phoneRaw);
  const phone = normalizeCitizenPhoneForStorage(phoneDigits);
  if (!phone || phone.length < 8) return { ok: false, error: "رقم الهاتف غير صالح." };

  const phoneTaken = await db.user.findUnique({ where: { phone } });
  if (phoneTaken) return { ok: false, error: "رقم الهاتف مستخدم مسبقاً." };

  const areaTaken = await db.user.findFirst({
    where: {
      role: UserRole.GAS_AGENT,
      municipalityId,
      gasArea: area,
    },
  });
  if (areaTaken) return { ok: false, error: "هذه المنطقة مخصصة لمعتمد آخر في نفس البلدية." };

  const created = await db.user.create({
    data: {
      municipalityId,
      name,
      phone,
      gasArea: area,
      passwordHash: await hashPassword(password),
      role: UserRole.GAS_AGENT,
      isVerified: true,
      isActive: true,
    },
  });
  await writeOperationLog({
    session: s,
    municipalityId,
    action: "CREATE",
    module: "GAS",
    title: "إنشاء حساب معتمد غاز",
    description: `تم إنشاء حساب معتمد الغاز: ${name}`,
    entityType: "USER",
    entityId: created.id,
    metadata: { name, phone, area, role: UserRole.GAS_AGENT },
  });

  revalidatePath("/admin/gas-services");
  return { ok: true, message: "تم إنشاء حساب معتمد الغاز بنجاح." };
}

export async function updateGasAgentAction(formData: FormData): Promise<UpdateGasAgentResult> {
  const s = await auth();
  if (!s?.user || !staffCanManageGas(s)) {
    return { ok: false, error: "غير مصرّح" };
  }

  const userId = String(formData.get("userId") ?? "").trim();
  if (!userId) return { ok: false, error: "معرّف المعتمد غير صالح." };

  const existing = await db.user.findFirst({
    where: { id: userId, role: UserRole.GAS_AGENT },
    select: { id: true, phone: true, gasArea: true, municipalityId: true },
  });
  if (!existing?.municipalityId) return { ok: false, error: "المعتمد غير موجود." };
  try {
    assertStaffCanAccessMunicipality(s, existing.municipalityId);
  } catch {
    return { ok: false, error: "غير مصرّح" };
  }

  const name = String(formData.get("name") ?? "").trim();
  const phoneRaw = String(formData.get("phone") ?? "").trim();
  const area = String(formData.get("area") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (name.length < 3) return { ok: false, error: "اسم المعتمد يجب أن يكون 3 أحرف على الأقل." };
  if (area.length < 2) return { ok: false, error: "يرجى إدخال المنطقة المخصصة." };

  const phoneDigits = digitsOnly(phoneRaw);
  const phone = normalizeCitizenPhoneForStorage(phoneDigits);
  if (!phone || phone.length < 8) return { ok: false, error: "رقم الهاتف غير صالح." };

  if (phone !== existing.phone) {
    const phoneTaken = await db.user.findUnique({ where: { phone } });
    if (phoneTaken) return { ok: false, error: "رقم الهاتف مستخدم مسبقاً." };
  }

  if (area !== existing.gasArea) {
    const areaTaken = await db.user.findFirst({
      where: {
        role: UserRole.GAS_AGENT,
        municipalityId: existing.municipalityId,
        gasArea: area,
        id: { not: userId },
      },
    });
    if (areaTaken) return { ok: false, error: "هذه المنطقة مخصصة لمعتمد آخر في نفس البلدية." };
  }

  if (password.length > 0 && password.length < 6) {
    return { ok: false, error: "كلمة المرور 6 أحرف على الأقل إذا أردت تغييرها." };
  }

  const updated = await db.user.update({
    where: { id: userId },
    data: {
      name,
      phone,
      gasArea: area,
      ...(password.length > 0 ? { passwordHash: await hashPassword(password) } : {}),
    },
  });
  await writeOperationLog({
    session: s,
    municipalityId: existing.municipalityId,
    action: "UPDATE",
    module: "GAS",
    title: "تعديل معتمد غاز",
    description: `تم تعديل بيانات معتمد الغاز: ${name}`,
    entityType: "USER",
    entityId: userId,
    metadata: { before: existing, after: { id: updated.id, name, phone, gasArea: area } },
  });

  revalidatePath("/admin/gas-services");
  return { ok: true, message: "تم تحديث بيانات المعتمد بنجاح." };
}
