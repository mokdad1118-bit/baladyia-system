import type { Session } from "next-auth";
import type { Prisma } from "@/generated/prisma/client";
import { UserRole } from "@/generated/prisma/enums";
import { isMunicipalityAdminRole, isSuperAdminRole } from "@/lib/roles";

/** فلترة Prisma: `{ municipalityId }` أو `{}` لمشرف المحافظة دون نطاق فرعي */
export function staffMunicipalityIdFilter(
  session: Session | null,
): { municipalityId: string } | Record<string, never> {
  if (!session?.user) return { municipalityId: "__none__" };
  const { role, municipalityId, activeMunicipalityId } = session.user;
  if (isSuperAdminRole(role)) {
    const scoped = activeMunicipalityId?.trim();
    if (scoped) return { municipalityId: scoped };
    return {};
  }
  if (role === UserRole.MUNICIPALITY_ADMIN || role === UserRole.EMPLOYEE) {
    const mid = municipalityId?.trim();
    if (!mid) return { municipalityId: "__none__" };
    return { municipalityId: mid };
  }
  return { municipalityId: "__none__" };
}

export function staffCitizenUserWhere(session: Session | null): Prisma.UserWhereInput {
  return {
    role: UserRole.CITIZEN,
    ...staffMunicipalityIdFilter(session),
  };
}

/** موظفو البلدية ومديروها — مع نطاق البلدية لمشرف المحافظة */
export function staffStaffUserWhere(session: Session | null): Prisma.UserWhereInput {
  const mun = staffMunicipalityIdFilter(session);
  const role = isSuperAdminRole(session?.user?.role ?? UserRole.CITIZEN)
    ? { in: [UserRole.SUPER_ADMIN, UserRole.MUNICIPALITY_ADMIN, UserRole.EMPLOYEE] as UserRole[] }
    : UserRole.EMPLOYEE;
  return { ...mun, role };
}

export function staffGasAgentUserWhere(session: Session | null): Prisma.UserWhereInput {
  return {
    role: UserRole.GAS_AGENT,
    ...staffMunicipalityIdFilter(session),
  };
}

export function citizenMunicipalityIdOrThrow(session: Session | null): string {
  if (!session?.user || session.user.role !== UserRole.CITIZEN) {
    throw new Error("citizen_session_required");
  }
  const mid = session.user.municipalityId?.trim();
  if (!mid) throw new Error("citizen_municipality_missing");
  return mid;
}

export function assertStaffCanAccessMunicipality(session: Session | null, municipalityId: string) {
  const f = staffMunicipalityIdFilter(session);
  if ("municipalityId" in f && f.municipalityId !== municipalityId) {
    throw new Error("municipality_access_denied");
  }
}

/** بلدية الإنشاء: مشرف المحافظة من النموذج، مدير البلدية من جلسته */
export function resolveMunicipalityIdForStaffCreate(
  session: Session | null,
  formData: FormData,
): string | null {
  if (!session?.user) return null;
  if (isSuperAdminRole(session.user.role)) {
    return String(formData.get("municipalityId") ?? "").trim() || null;
  }
  if (isMunicipalityAdminRole(session.user.role)) {
    return session.user.municipalityId?.trim() ?? null;
  }
  return session.user.municipalityId?.trim() ?? null;
}
