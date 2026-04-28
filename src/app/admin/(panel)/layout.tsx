import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { UserRole } from "@/generated/prisma/enums";
import { AdminNav } from "@/components/admin/AdminNav";
import { GovWorkspaceShell } from "@/components/gov/GovWorkspaceShell";
import {
  citizenPortalOrigin,
  isStaffPortalHostname,
  staffPortalSplitEnabled,
  staffUnauthenticatedLoginPath,
} from "@/lib/staff-portal";

export default async function AdminPanelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const s = await auth();
  const host = (await headers()).get("host");
  const staffRoot = staffPortalSplitEnabled() && isStaffPortalHostname(host);
  if (!s?.user) redirect(staffUnauthenticatedLoginPath(host, "/admin"));
  if (s.user.role === UserRole.CITIZEN) redirect(citizenPortalOrigin() ?? "/");
  if (s.user.role !== UserRole.EMPLOYEE && s.user.role !== UserRole.ADMIN) {
    redirect(citizenPortalOrigin() ?? "/");
  }
  const isAdmin = s.user.role === UserRole.ADMIN;
  const homeHref = staffRoot ? "/" : "/admin";
  const logoutCallbackUrl = staffRoot
    ? "/login"
    : citizenPortalOrigin() !== undefined
      ? citizenPortalOrigin()
      : "/";
  return (
    <GovWorkspaceShell
      portalTitle="لوحة التحكم"
      nav={<AdminNav isAdmin={isAdmin} staffRoot={staffRoot} />}
      homeHref={homeHref}
      logoutCallbackUrl={logoutCallbackUrl}
    >
      {children}
    </GovWorkspaceShell>
  );
}
