import type { Session } from "next-auth";
import { UserRole } from "@/generated/prisma/enums";
import { hasFullAdminPrivileges, isSuperAdminRole } from "@/lib/roles";

export type StaffNavPermissions = {
  viewRequests: boolean;
  manageGas: boolean;
  manageSocialServices: boolean;
  manageInPersonRequests: boolean;
  manageCitizenFeedback: boolean;
  viewCitizens: boolean;
  viewOperationLog: boolean;
  manageServices: boolean;
  manageUsers: boolean;
  viewStats: boolean;
  manageAreaNews: boolean;
  manageArchive: boolean;
};

export const emptyStaffNavPermissions: StaffNavPermissions = {
  viewRequests: false,
  manageGas: false,
  manageSocialServices: false,
  manageInPersonRequests: false,
  manageCitizenFeedback: false,
  viewCitizens: false,
  viewOperationLog: false,
  manageServices: false,
  manageUsers: false,
  viewStats: false,
  manageAreaNews: false,
  manageArchive: false,
};

export const fullStaffNavPermissions: StaffNavPermissions = {
  viewRequests: true,
  manageGas: true,
  manageSocialServices: true,
  manageInPersonRequests: true,
  manageCitizenFeedback: true,
  viewCitizens: true,
  viewOperationLog: true,
  manageServices: true,
  manageUsers: true,
  viewStats: true,
  manageAreaNews: true,
  manageArchive: true,
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
    manageInPersonRequests: Boolean(u.permManageInPersonRequests),
    manageCitizenFeedback: Boolean(u.permManageCitizenFeedback),
    viewCitizens: Boolean(u.permViewCitizens),
    viewOperationLog: Boolean(u.permViewOperationLog),
    manageServices: Boolean(u.permManageServices),
    manageUsers: Boolean(u.permManageUsers),
    viewStats: Boolean(u.permViewStats),
    manageAreaNews: Boolean(u.permManageAreaNews),
    manageArchive: Boolean(u.permManageArchive),
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

export function staffCanManageInPersonRequests(s: Session | null): boolean {
  return staffNavPermissions(s).manageInPersonRequests;
}

export function staffCanManageCitizenFeedback(s: Session | null): boolean {
  return staffNavPermissions(s).manageCitizenFeedback;
}

export function staffCanViewCitizens(s: Session | null): boolean {
  return staffNavPermissions(s).viewCitizens;
}

export function staffCanViewOperationLog(s: Session | null): boolean {
  return staffNavPermissions(s).viewOperationLog;
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

export function staffCanManageAreaNews(s: Session | null): boolean {
  return staffNavPermissions(s).manageAreaNews;
}

export function staffCanManageArchive(s: Session | null): boolean {
  return staffNavPermissions(s).manageArchive;
}

export type EmployeePermPayload = {
  permViewRequests: boolean;
  permManageGas: boolean;
  permManageSocialServices: boolean;
  permManageInPersonRequests: boolean;
  permManageCitizenFeedback: boolean;
  permViewCitizens: boolean;
  permViewOperationLog: boolean;
  permManageServices: boolean;
  permManageUsers: boolean;
  permViewStats: boolean;
  permManageAreaNews: boolean;
  permManageArchive: boolean;
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
  if (p.permManageInPersonRequests && !u.permManageInPersonRequests) {
    return "لا يمكنك منح صلاحية الطلبات الحضورية";
  }
  if (p.permManageCitizenFeedback && !u.permManageCitizenFeedback) {
    return "لا يمكنك منح صلاحية شكاوى واقتراحات المواطنين";
  }
  if (p.permViewCitizens && !u.permViewCitizens) {
    return "لا يمكنك منح صلاحية حسابات المواطنين";
  }
  if (p.permViewOperationLog && !u.permViewOperationLog) {
    return "لا يمكنك منح صلاحية سجل العمليات";
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
  if (p.permManageAreaNews && !u.permManageAreaNews) {
    return "لا يمكنك منح صلاحية أخبار المنطقة";
  }
  if (p.permManageArchive && !u.permManageArchive) {
    return "لا يمكنك منح صلاحية الأرشيف";
  }
  return undefined;
}

/** إنشاء مستخدمين إداريين (مشرف محافظة / مدير بلدية) — للمشرف الأعلى فقط */
export function canCreateElevatedStaffRoles(s: Session | null): boolean {
  return isSuperAdminRole(sessionUser(s)?.role ?? UserRole.CITIZEN);
}
