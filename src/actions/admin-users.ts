"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { hashPassword } from "@/lib/password";
import { UserRole } from "@/generated/prisma/enums";
import {
  staffCanManageUsers,
  validateAssignableEmployeePerms,
  canCreateElevatedStaffRoles,
} from "@/lib/staff-permissions";
import { isMunicipalityAdminRole, isSuperAdminRole } from "@/lib/roles";
import { assertStaffCanAccessMunicipality } from "@/lib/municipality-scope";
import { writeOperationLog } from "@/lib/operation-log";

function parseEmployeePerms(formData: FormData) {
  return {
    permViewRequests: formData.get("permViewRequests") === "on",
    permManageGas: formData.get("permManageGas") === "on",
    permManageSocialServices: formData.get("permManageSocialServices") === "on",
    permManageCitizenFeedback: formData.get("permManageCitizenFeedback") === "on",
    permViewCitizens: formData.get("permViewCitizens") === "on",
    permViewOperationLog: formData.get("permViewOperationLog") === "on",
    permManageServices: formData.get("permManageServices") === "on",
    permManageUsers: formData.get("permManageUsers") === "on",
    permViewStats: formData.get("permViewStats") === "on",
  };
}

function hasAnyEmployeePerm(p: ReturnType<typeof parseEmployeePerms>) {
  return Object.values(p).some(Boolean);
}

function parseStaffRole(raw: string): UserRole | null {
  if (raw === UserRole.SUPER_ADMIN) return UserRole.SUPER_ADMIN;
  if (raw === UserRole.MUNICIPALITY_ADMIN) return UserRole.MUNICIPALITY_ADMIN;
  if (raw === UserRole.EMPLOYEE) return UserRole.EMPLOYEE;
  return null;
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
  const roleRaw = String(formData.get("role") ?? UserRole.EMPLOYEE);
  const role = parseStaffRole(roleRaw);
  if (!role) return { error: "دور غير صالح" };

  if (role === UserRole.SUPER_ADMIN && !canCreateElevatedStaffRoles(s)) {
    return { error: "إنشاء مشرف محافظة متاح للمشرف الأعلى فقط" };
  }
  if (role === UserRole.MUNICIPALITY_ADMIN && !canCreateElevatedStaffRoles(s)) {
    return { error: "إنشاء مدير بلدية متاح للمشرف الأعلى فقط" };
  }

  let municipalityId: string | null = null;
  if (isSuperAdminRole(s!.user!.role)) {
    municipalityId =
      role === UserRole.SUPER_ADMIN
        ? null
        : String(formData.get("municipalityId") ?? "")
            .trim()
            .length > 0
          ? String(formData.get("municipalityId")).trim()
          : null;
    if (role !== UserRole.SUPER_ADMIN && !municipalityId) {
      return { error: "يرجى اختيار البلدية لهذا الحساب" };
    }
  } else if (isMunicipalityAdminRole(s!.user!.role)) {
    if (role !== UserRole.EMPLOYEE) {
      return { error: "مدير البلدية يمكنه إنشاء موظفين فقط" };
    }
    municipalityId = s!.user!.municipalityId?.trim() ?? null;
    if (!municipalityId) return { error: "حسابك غير مرتبط ببلدية" };
  } else {
    return { error: "غير مصرّح" };
  }

  if (!name || !email || !password) return { error: "تعبئة كافة الحقول" };
  if (password.length < 6) return { error: "كلمة المرور 6 أحرف على الأقل" };
  const ext = await db.user.findUnique({ where: { email } });
  if (ext) return { error: "البريد مستخدم" };

  let permManageServices = false;
  let permManageUsers = false;
  let permViewStats = false;
  let permViewRequests = false;
  let permManageGas = false;
  let permManageSocialServices = false;
  let permManageCitizenFeedback = false;
  let permViewCitizens = false;
  let permViewOperationLog = false;
  if (role === UserRole.SUPER_ADMIN || role === UserRole.MUNICIPALITY_ADMIN) {
    permViewRequests = true;
    permManageGas = true;
    permManageSocialServices = true;
    permManageCitizenFeedback = true;
    permViewCitizens = true;
    permViewOperationLog = true;
    permManageServices = true;
    permManageUsers = true;
    permViewStats = true;
  } else {
    const p = parseEmployeePerms(formData);
    if (!hasAnyEmployeePerm(p)) {
      return { error: "اختر صلاحية واحدة على الأقل للموظف" };
    }
    const assignErr = validateAssignableEmployeePerms(s, p);
    if (assignErr) return { error: assignErr };
    permViewRequests = p.permViewRequests;
    permManageGas = p.permManageGas;
    permManageSocialServices = p.permManageSocialServices;
    permManageCitizenFeedback = p.permManageCitizenFeedback;
    permViewCitizens = p.permViewCitizens;
    permViewOperationLog = p.permViewOperationLog;
    permManageServices = p.permManageServices;
    permManageUsers = p.permManageUsers;
    permViewStats = p.permViewStats;
  }

  const created = await db.user.create({
    data: {
      name,
      email,
      passwordHash: await hashPassword(password),
      role,
      municipalityId,
      permViewRequests,
      permManageGas,
      permManageSocialServices,
      permManageCitizenFeedback,
      permViewCitizens,
      permViewOperationLog,
      permManageServices,
      permManageUsers,
      permViewStats,
    },
  });
  await writeOperationLog({
    session: s,
    municipalityId,
    action: "CREATE",
    module: "USERS",
    title: "إنشاء حساب موظف/مدير",
    description: `تم إنشاء الحساب: ${name}`,
    entityType: "USER",
    entityId: created.id,
    metadata: { name, email, role, permissions: parseEmployeePerms(formData) },
  });
  revalidatePath("/admin/users");
  revalidatePath("/admin");
  return { error: undefined, ok: true as const };
}

export async function updateEmployeePermissions(
  _p: { error?: string } | undefined,
  formData: FormData,
) {
  const s = await auth();
  if (!staffCanManageUsers(s)) {
    return { error: "غير مصرّح" };
  }
  const userId = String(formData.get("userId") ?? "").trim();
  if (!userId) return { error: "المستخدم غير موجود" };
  if (userId === s!.user!.id) return { error: "لا يمكنك تعديل صلاحيات حسابك" };

  const target = await db.user.findUnique({
    where: { id: userId },
    select: { role: true, municipalityId: true },
  });
  if (!target) return { error: "المستخدم غير موجود" };
  if (target.role !== UserRole.EMPLOYEE) {
    return { error: "يمكن تعديل صلاحيات الموظفين فقط" };
  }
  if (target.municipalityId) {
    try {
      assertStaffCanAccessMunicipality(s, target.municipalityId);
    } catch {
      return { error: "غير مصرّح" };
    }
  } else if (!isSuperAdminRole(s!.user!.role)) {
    return { error: "غير مصرّح" };
  }

  const p = parseEmployeePerms(formData);
  if (!hasAnyEmployeePerm(p)) {
    return { error: "اختر صلاحية واحدة على الأقل للموظف" };
  }
  const assignErr = validateAssignableEmployeePerms(s, p);
  if (assignErr) return { error: assignErr };

  await db.user.update({ where: { id: userId }, data: p });
  await writeOperationLog({
    session: s,
    municipalityId: target.municipalityId,
    action: "UPDATE_PERMISSIONS",
    module: "USERS",
    title: "تعديل صلاحيات موظف",
    description: "تم تعديل صلاحيات حساب موظف",
    entityType: "USER",
    entityId: userId,
    metadata: { permissions: p },
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
  const target = await db.user.findUnique({
    where: { id: userId },
    select: { role: true, municipalityId: true, name: true },
  });
  if (!target) return { error: "المستخدم غير موجود" };
  if (target.role === UserRole.CITIZEN && target.municipalityId) {
    try {
      assertStaffCanAccessMunicipality(s, target.municipalityId);
    } catch {
      return { error: "غير مصرّح" };
    }
  } else if (target.role !== UserRole.CITIZEN) {
    if (target.municipalityId) {
      try {
        assertStaffCanAccessMunicipality(s, target.municipalityId);
      } catch {
        return { error: "غير مصرّح" };
      }
    } else if (!isSuperAdminRole(s!.user!.role)) {
      return { error: "غير مصرّح" };
    }
  }
  await db.user.update({ where: { id: userId }, data: { isActive } });
  await writeOperationLog({
    session: s,
    municipalityId: target.municipalityId,
    action: isActive ? "ACTIVATE" : "DEACTIVATE",
    module: "USERS",
    title: isActive ? "تفعيل حساب" : "تعطيل حساب",
    description: `${isActive ? "تم تفعيل" : "تم تعطيل"} الحساب: ${target.name}`,
    entityType: "USER",
    entityId: userId,
    metadata: { role: target.role, isActive },
  });
  revalidatePath("/admin/users");
  revalidatePath("/admin/citizens");
  return { ok: true as const };
}

/**
 * حذف حساب مواطن بالكامل ليُفرّغ البريد/الهاتف/الرقم الوطني للتسجيل من جديد.
 * يحذف أيضاً طلبات المواطن وجميع مرفقاتها وسجلّها (لا يمكن استرجاعها).
 */
export async function deleteCitizenAccount(userId: string) {
  const s = await auth();
  if (!staffCanManageUsers(s)) {
    return { error: "غير مصرّح" } as const;
  }

  const user = await db.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      role: true,
      email: true,
      notificationEmail: true,
      municipalityId: true,
    },
  });
  if (!user) return { error: "المستخدم غير موجود" } as const;
  if (user.role !== UserRole.CITIZEN) {
    return { error: "يمكن حذف حسابات المواطنين فقط" } as const;
  }
  if (user.municipalityId) {
    try {
      assertStaffCanAccessMunicipality(s, user.municipalityId);
    } catch {
      return { error: "غير مصرّح" } as const;
    }
  }

  const otpEmails = [user.email, user.notificationEmail].filter(
    (e): e is string => Boolean(e?.trim()),
  );

  await db.$transaction(async (tx) => {
    if (otpEmails.length > 0) {
      await tx.emailOtp.deleteMany({
        where: { email: { in: [...new Set(otpEmails)] } },
      });
    }

    await tx.notification.deleteMany({ where: { userId } });

    await tx.request.deleteMany({ where: { citizenId: userId } });

    await tx.user.delete({ where: { id: userId, role: UserRole.CITIZEN } });
  });
  await writeOperationLog({
    session: s,
    municipalityId: user.municipalityId,
    action: "DELETE",
    module: "USERS",
    title: "حذف حساب مواطن",
    description: `تم حذف حساب مواطن: ${user.email ?? user.notificationEmail ?? user.id}`,
    entityType: "USER",
    entityId: userId,
    metadata: user,
  });

  revalidatePath("/admin/citizens");
  revalidatePath("/admin");
  revalidatePath("/admin/requests");
  revalidatePath("/admin/stats");
  return { ok: true as const };
}
