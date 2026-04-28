"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { hashPassword } from "@/lib/password";
import { UserRole } from "@/generated/prisma/enums";

export async function createStaffUser(
  _p: { error?: string } | undefined,
  formData: FormData,
) {
  const s = await auth();
  if (!s?.user || s.user.role !== UserRole.ADMIN) {
    return { error: "غير مصرّح" };
  }
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const roleRaw = String(formData.get("role") ?? "EMPLOYEE");
  const role = roleRaw === "ADMIN" ? UserRole.ADMIN : UserRole.EMPLOYEE;
  if (!name || !email || !password) return { error: "تعبئة كافة الحقول" };
  if (password.length < 6) return { error: "كلمة المرور 6 أحرف على الأقل" };
  const ext = await db.user.findUnique({ where: { email } });
  if (ext) return { error: "البريد مستخدم" };
  await db.user.create({
    data: { name, email, passwordHash: await hashPassword(password), role },
  });
  revalidatePath("/admin/users");
  revalidatePath("/admin");
  return { error: undefined, ok: true as const };
}

export async function setUserActive(userId: string, isActive: boolean) {
  const s = await auth();
  if (!s?.user || s.user.role !== UserRole.ADMIN) {
    return { error: "غير مصرّح" };
  }
  if (userId === s.user.id) return { error: "لا يمكنك تعطيل حسابك" };
  await db.user.update({ where: { id: userId }, data: { isActive } });
  revalidatePath("/admin/users");
  revalidatePath("/admin/citizens");
  return { ok: true as const };
}
