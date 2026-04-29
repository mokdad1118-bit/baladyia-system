import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { UserRole } from "@/generated/prisma/enums";
import { AdminNav } from "@/components/admin/AdminNav";
import { staffNavPermissions } from "@/lib/staff-permissions";
import { GovWorkspaceShell } from "@/components/gov/GovWorkspaceShell";
import {
  citizenPortalOrigin,
  isStaffPortalHostname,
  requestOriginFromHeaders,
  staffPortalSplitDisabledForOrigin,
  staffPortalSplitEnabled,
  staffUnauthenticatedLoginPath,
} from "@/lib/staff-portal";

export default async function AdminPanelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const s = await auth();
  const h = await headers();
  const host = h.get("host");
  const origin = requestOriginFromHeaders(h);
  const splitOff = staffPortalSplitDisabledForOrigin(origin, host);
  const staffRoot =
    staffPortalSplitEnabled() && !splitOff && isStaffPortalHostname(host);
  if (!s?.user) redirect(staffUnauthenticatedLoginPath(host, "/admin"));
  if (s.user.role === UserRole.CITIZEN) redirect(citizenPortalOrigin() ?? "/");
  if (s.user.role !== UserRole.EMPLOYEE && s.user.role !== UserRole.ADMIN) {
    redirect(citizenPortalOrigin() ?? "/");
  }
  const staffPerms = staffNavPermissions(s);
  const homeHref = staffRoot ? "/" : "/admin";
  const logoutCallbackUrl = staffRoot
    ? "/login"
    : citizenPortalOrigin() !== undefined
      ? citizenPortalOrigin()
      : "/";
  return (
    <GovWorkspaceShell
      portalTitle="لوحة التحكم"
      nav={<AdminNav staffPerms={staffPerms} staffRoot={staffRoot} />}
      homeHref={homeHref}
      logoutCallbackUrl={logoutCallbackUrl}
    >
      {children}
    </GovWorkspaceShell>
  );
}
