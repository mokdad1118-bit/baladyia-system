import { UserRole } from "@/generated/prisma/enums";

export function homeForRole(role: UserRole | undefined) {
  if (!role) return "/";
  if (role === UserRole.ADMIN || role === UserRole.EMPLOYEE) return "/admin";
  if (role === UserRole.GAS_AGENT) return "/gas-agent";
  return "/";
}
