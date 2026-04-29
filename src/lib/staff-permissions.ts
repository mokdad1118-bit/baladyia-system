import type { Session } from "next-auth";
import { UserRole } from "@/generated/prisma/enums";

export type StaffNavPermissions = {
  manageServices: boolean;
  manageUsers: boolean;
  viewStats: boolean;
};

function sessionUser(s: Session | null) {
  return s?.user ?? null;
}

/** صلاحيات ظهور عناصر التنقل في لوحة الإدارة */
export function staffNavPermissions(s: Session | null): StaffNavPermissions {
  const u = sessionUser(s);
  if (!u) return { manageServices: false, manageUsers: false, viewStats: false };
  if (u.role === UserRole.ADMIN) {
    return { manageServices: true, manageUsers: true, viewStats: true };
  }
  if (u.role !== UserRole.EMPLOYEE) {
    return { manageServices: false, manageUsers: false, viewStats: false };
  }
  return {
    manageServices: Boolean(u.permManageServices),
    manageUsers: Boolean(u.permManageUsers),
    viewStats: Boolean(u.permViewStats),
  };
}

export function staffCanManageServices(s: Session | null): boolean {
  return staffNavPermissions(s).manageServices;
}

export function staffCanManageUsers(s: Session | null): boolean {
  return staffNavPermissions(s).manageUsers;
}

export function staffCanViewStats(s: Session | null): boolean {
  return staffNavPermissions(s).viewStats;
}

export type EmployeePermPayload = {
  permManageServices: boolean;
  permManageUsers: boolean;
  permViewStats: boolean;
};

/** يمنع منح صلاحية لا يملكها المنشئ (ما عدا المدير) */
export function validateAssignableEmployeePerms(
  creator: Session | null,
  p: EmployeePermPayload,
): string | undefined {
  const u = sessionUser(creator);
  if (!u) return "غير مصرّح";
  if (u.role === UserRole.ADMIN) return undefined;
  if (u.role !== UserRole.EMPLOYEE) return "غير مصرّح";
  if (p.permManageServices && !u.permManageServices) {
    return "لا يمكنك منح صلاحية إدارة الخدمات";
  }
  if (p.permManageUsers && !u.permManageUsers) {
    return "لا يمكنك منح صلاحية إدارة الموظفين";
  }
  if (p.permViewStats && !u.permViewStats) {
    return "لا يمكنك منح صلاحية الإحصائيات";
  }
  return undefined;
}
