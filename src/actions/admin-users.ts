"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { hashPassword } from "@/lib/password";
import { UserRole } from "@/generated/prisma/enums";
import {
  staffCanManageUsers,
  validateAssignableEmployeePerms,
} from "@/lib/staff-permissions";

function parseEmployeePerms(formData: FormData) {
  return {
    permManageServices: formData.get("permManageServices") === "on",
    permManageUsers: formData.get("permManageUsers") === "on",
    permViewStats: formData.get("permViewStats") === "on",
  };
}

export async function createStaffUser(
  _p: { error?: string } | undefined,
  formData: FormData,
) {
  const s = await auth();
  if (!staffCanManageUsers(s)) {
    return { error: "غير مصرّح" };
  }
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const roleRaw = String(formData.get("role") ?? "EMPLOYEE");
  const role = roleRaw === "ADMIN" ? UserRole.ADMIN : UserRole.EMPLOYEE;
  if (role === UserRole.ADMIN && s!.user!.role !== UserRole.ADMIN) {
    return { error: "إنشاء حساب مدير نظام متاح للمدير فقط" };
  }
  if (!name || !email || !password) return { error: "تعبئة كافة الحقول" };
  if (password.length < 6) return { error: "كلمة المرور 6 أحرف على الأقل" };
  const ext = await db.user.findUnique({ where: { email } });
  if (ext) return { error: "البريد مستخدم" };

  let permManageServices = false;
  let permManageUsers = false;
  let permViewStats = false;
  if (role === UserRole.ADMIN) {
    permManageServices = true;
    permManageUsers = true;
    permViewStats = true;
  } else {
    const p = parseEmployeePerms(formData);
    if (!p.permManageServices && !p.permManageUsers && !p.permViewStats) {
      return { error: "اختر صلاحية واحدة على الأقل للموظف" };
    }
    const assignErr = validateAssignableEmployeePerms(s, p);
    if (assignErr) return { error: assignErr };
    permManageServices = p.permManageServices;
    permManageUsers = p.permManageUsers;
    permViewStats = p.permViewStats;
  }

  await db.user.create({
    data: {
      name,
      email,
      passwordHash: await hashPassword(password),
      role,
      permManageServices,
      permManageUsers,
      permViewStats,
    },
  });
  revalidatePath("/admin/users");
  revalidatePath("/admin");
  return { error: undefined, ok: true as const };
}

export async function setUserActive(userId: string, isActive: boolean) {
  const s = await auth();
  if (!staffCanManageUsers(s)) {
    return { error: "غير مصرّح" };
  }
  if (userId === s!.user!.id) return { error: "لا يمكنك تعطيل حسابك" };
  await db.user.update({ where: { id: userId }, data: { isActive } });
  revalidatePath("/admin/users");
  revalidatePath("/admin/citizens");
  return { ok: true as const };
}
