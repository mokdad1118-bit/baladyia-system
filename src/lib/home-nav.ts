import { UserRole } from "@/generated/prisma/enums";
import { isAdminPanelRole } from "@/lib/roles";

export function homeForRole(role: UserRole | undefined) {
  if (!role) return "/";
  if (isAdminPanelRole(role) || role === UserRole.EMPLOYEE) return "/admin";
  if (role === UserRole.GAS_AGENT) return "/gas-agent";
  return "/";
}
