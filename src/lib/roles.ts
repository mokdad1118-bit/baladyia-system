import { UserRole } from "@/generated/prisma/enums";

export function isSuperAdminRole(role: UserRole): boolean {
  return role === UserRole.SUPER_ADMIN;
}

export function isMunicipalityAdminRole(role: UserRole): boolean {
  return role === UserRole.MUNICIPALITY_ADMIN;
}

/** من يدخل لوحة /admin (مشرف المحافظة أو مدير بلدية) */
export function isAdminPanelRole(role: UserRole): boolean {
  return role === UserRole.SUPER_ADMIN || role === UserRole.MUNICIPALITY_ADMIN;
}

/** صلاحيات «المدير العام» في المنطق القديم (إدارة كاملة ضمن النطاق) */
export function hasFullAdminPrivileges(role: UserRole): boolean {
  return role === UserRole.SUPER_ADMIN || role === UserRole.MUNICIPALITY_ADMIN;
}
