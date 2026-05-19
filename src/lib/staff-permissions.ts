import type { Session } from "next-auth";
import { UserRole } from "@/generated/prisma/enums";
import { hasFullAdminPrivileges, isSuperAdminRole } from "@/lib/roles";

export type StaffNavPermissions = {
  viewRequests: boolean;
  manageGas: boolean;
  manageSocialServices: boolean;
  manageCitizenFeedback: boolean;
  viewCitizens: boolean;
  manageServices: boolean;
  manageUsers: boolean;
  viewStats: boolean;
};

export const emptyStaffNavPermissions: StaffNavPermissions = {
  viewRequests: false,
  manageGas: false,
  manageSocialServices: false,
  manageCitizenFeedback: false,
  viewCitizens: false,
  manageServices: false,
  manageUsers: false,
  viewStats: false,
};

export const fullStaffNavPermissions: StaffNavPermissions = {
  viewRequests: true,
  manageGas: true,
  manageSocialServices: true,
  manageCitizenFeedback: true,
  viewCitizens: true,
  manageServices: true,
  manageUsers: true,
  viewStats: true,
};

function sessionUser(s: Session | null) {
  return s?.user ?? null;
}

/** صلاحيات ظهور عناصر التنقل في لوحة الإدارة */
export function staffNavPermissions(s: Session | null): StaffNavPermissions {
  const u = sessionUser(s);
  if (!u) return emptyStaffNavPermissions;
  if (hasFullAdminPrivileges(u.role)) {
    return fullStaffNavPermissions;
  }
  if (u.role !== UserRole.EMPLOYEE) {
    return emptyStaffNavPermissions;
  }
  return {
    viewRequests: Boolean(u.permViewRequests),
    manageGas: Boolean(u.permManageGas),
    manageSocialServices: Boolean(u.permManageSocialServices),
    manageCitizenFeedback: Boolean(u.permManageCitizenFeedback),
    viewCitizens: Boolean(u.permViewCitizens),
    manageServices: Boolean(u.permManageServices),
    manageUsers: Boolean(u.permManageUsers),
    viewStats: Boolean(u.permViewStats),
  };
}

export function hasAnyStaffPanelPermission(s: Session | null): boolean {
  return Object.values(staffNavPermissions(s)).some(Boolean);
}

export function staffCanViewRequests(s: Session | null): boolean {
  return staffNavPermissions(s).viewRequests;
}

export function staffCanManageGas(s: Session | null): boolean {
  return staffNavPermissions(s).manageGas;
}

export function staffCanManageSocialServices(s: Session | null): boolean {
  return staffNavPermissions(s).manageSocialServices;
}

export function staffCanManageCitizenFeedback(s: Session | null): boolean {
  return staffNavPermissions(s).manageCitizenFeedback;
}

export function staffCanViewCitizens(s: Session | null): boolean {
  return staffNavPermissions(s).viewCitizens;
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
  permViewRequests: boolean;
  permManageGas: boolean;
  permManageSocialServices: boolean;
  permManageCitizenFeedback: boolean;
  permViewCitizens: boolean;
  permManageServices: boolean;
  permManageUsers: boolean;
  permViewStats: boolean;
};

/** يمنع منح صلاحية لا يملكها المنشئ (ما عدا المشرف أو مدير البلدية بامتيازات كاملة) */
export function validateAssignableEmployeePerms(
  creator: Session | null,
  p: EmployeePermPayload,
): string | undefined {
  const u = sessionUser(creator);
  if (!u) return "غير مصرّح";
  if (hasFullAdminPrivileges(u.role)) return undefined;
  if (u.role !== UserRole.EMPLOYEE) return "غير مصرّح";
  if (p.permViewRequests && !u.permViewRequests) {
    return "لا يمكنك منح صلاحية طلبات خدمات المدينة";
  }
  if (p.permManageGas && !u.permManageGas) {
    return "لا يمكنك منح صلاحية خدمات الغاز";
  }
  if (p.permManageSocialServices && !u.permManageSocialServices) {
    return "لا يمكنك منح صلاحية الخدمات الاجتماعية";
  }
  if (p.permManageCitizenFeedback && !u.permManageCitizenFeedback) {
    return "لا يمكنك منح صلاحية شكاوى واقتراحات المواطنين";
  }
  if (p.permViewCitizens && !u.permViewCitizens) {
    return "لا يمكنك منح صلاحية حسابات المواطنين";
  }
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

/** إنشاء مستخدمين إداريين (مشرف محافظة / مدير بلدية) — للمشرف الأعلى فقط */
export function canCreateElevatedStaffRoles(s: Session | null): boolean {
  return isSuperAdminRole(sessionUser(s)?.role ?? UserRole.CITIZEN);
}
