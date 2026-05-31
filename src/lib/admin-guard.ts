import { redirect } from "next/navigation";
import type { Session } from "next-auth";
import { UserRole } from "@/generated/prisma/enums";
import { citizenPortalOrigin } from "@/lib/staff-portal";
import {
  hasAnyStaffPanelPermission,
  staffCanManageCitizenFeedback,
  staffCanManageGas,
  staffCanManageServices,
  staffCanManageSocialServices,
  staffCanManageUsers,
  staffCanManageAreaNews,
  staffCanViewCitizens,
  staffCanViewOperationLog,
  staffCanViewRequests,
  staffCanViewStats,
} from "@/lib/staff-permissions";
import { isAdminPanelRole, isSuperAdminRole } from "@/lib/roles";

type AuthSession = Session | null;

export async function requireAdminPanel(session: AuthSession) {
  if (!session?.user?.role) redirect("/admin/login?next=/admin");
  if (session.user.role === UserRole.CITIZEN) redirect(citizenPortalOrigin() ?? "/");
  if (session.user.role === UserRole.EMPLOYEE && !hasAnyStaffPanelPermission(session)) redirect("/staff");
  if (!isAdminPanelRole(session.user.role) && session.user.role !== UserRole.EMPLOYEE) {
    redirect(citizenPortalOrigin() ?? "/");
  }
}

export type StaffPanelPermissionKey =
  | "requests"
  | "gas"
  | "social"
  | "feedback"
  | "citizens"
  | "operationLog"
  | "services"
  | "users"
  | "stats"
  | "areaNews";

/** موظف بصلاحية محددة أو مدير نظام */
export async function requireStaffPanelPermission(
  session: AuthSession,
  key: StaffPanelPermissionKey,
) {
  await requireAdminPanel(session);
  const ok = {
    requests: staffCanViewRequests(session),
    gas: staffCanManageGas(session),
    social: staffCanManageSocialServices(session),
    feedback: staffCanManageCitizenFeedback(session),
    citizens: staffCanViewCitizens(session),
    operationLog: staffCanViewOperationLog(session),
    services: staffCanManageServices(session),
    users: staffCanManageUsers(session),
    stats: staffCanViewStats(session),
    areaNews: staffCanManageAreaNews(session),
  }[key];
  if (!ok) redirect("/admin");
}

/** صفحات إدارة البلديات وتقارير المقارنة — مشرف المحافظة فقط */
export async function requireSuperAdminPanel(session: AuthSession) {
  await requireAdminPanel(session);
  if (!isSuperAdminRole(session!.user!.role ?? UserRole.CITIZEN)) redirect("/admin");
}
