import { redirect } from "next/navigation";
import type { Session } from "next-auth";
import { UserRole } from "@/generated/prisma/enums";
import { citizenPortalOrigin } from "@/lib/staff-portal";
import {
  staffCanManageServices,
  staffCanManageUsers,
  staffCanViewStats,
} from "@/lib/staff-permissions";

type AuthSession = Session | null;

export async function requireAdminPanel(session: AuthSession) {
  if (!session?.user?.role) redirect("/admin/login?next=/admin");
  if (session.user.role === UserRole.CITIZEN) redirect(citizenPortalOrigin() ?? "/");
  if (session.user.role === UserRole.EMPLOYEE) redirect("/staff");
  if (session.user.role !== UserRole.ADMIN) redirect(citizenPortalOrigin() ?? "/");
}

export type StaffPanelPermissionKey = "services" | "users" | "stats";

/** موظف بصلاحية محددة أو مدير نظام */
export async function requireStaffPanelPermission(
  session: AuthSession,
  key: StaffPanelPermissionKey,
) {
  await requireAdminPanel(session);
  const ok =
    key === "services"
      ? staffCanManageServices(session)
      : key === "users"
        ? staffCanManageUsers(session)
        : staffCanViewStats(session);
  if (!ok) redirect("/admin");
}
