import { headers } from "next/headers";

import { redirect } from "next/navigation";

import { UserRole } from "@/generated/prisma/enums";

import {

  citizenPortalOrigin,

  staffPanelHomePath,

  staffUnauthenticatedLoginPath,

} from "@/lib/staff-portal";



type AuthSession = { user?: { role?: UserRole } } | null;



export async function requireAdminPanel(session: AuthSession) {

  const host = (await headers()).get("host");

  if (!session?.user?.role) redirect(staffUnauthenticatedLoginPath(host, "/admin"));

  if (session.user.role === UserRole.CITIZEN) redirect(citizenPortalOrigin() ?? "/");

  if (session.user.role !== UserRole.EMPLOYEE && session.user.role !== UserRole.ADMIN) {

    redirect(citizenPortalOrigin() ?? "/");

  }

}



export async function requireAdminRole(session: AuthSession) {

  await requireAdminPanel(session);

  const host = (await headers()).get("host");

  if (session!.user!.role !== UserRole.ADMIN) redirect(staffPanelHomePath(host));

}

