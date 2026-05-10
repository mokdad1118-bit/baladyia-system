import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { UserRole } from "@/generated/prisma/enums";
import { AdminNav } from "@/components/admin/AdminNav";
import { db } from "@/lib/db";
import { staffNavPermissions } from "@/lib/staff-permissions";
import { GovWorkspaceShell } from "@/components/gov/GovWorkspaceShell";
import {
  citizenPortalOrigin,
  isStaffPortalHostname,
  requestOriginFromHeaders,
  staffPortalSplitDisabledForOrigin,
  staffPortalSplitEnabled,
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
  if (!s?.user) redirect("/admin/login?next=/admin");
  if (s.user.role === UserRole.CITIZEN) redirect(citizenPortalOrigin() ?? "/citizen");
  if (s.user.role === UserRole.EMPLOYEE) redirect("/staff");
  if (s.user.role !== UserRole.ADMIN) {
    redirect("/citizen/welcome");
  }
  const staffPerms = staffNavPermissions(s);
  const newRequestsCount = await db.notification.count({
    where: {
      userId: s.user.id,
      read: false,
      type: "REQUEST_SUBMIT",
    },
  });
  const homeHref = staffRoot ? "/" : "/admin";
  const logoutCallbackUrl = "/admin/login";
  return (
    <GovWorkspaceShell
      portalTitle="لوحة التحكم"
      nav={<AdminNav staffPerms={staffPerms} staffRoot={staffRoot} newRequestsCount={newRequestsCount} />}
      homeHref={homeHref}
      logoutCallbackUrl={logoutCallbackUrl}
    >
      {children}
    </GovWorkspaceShell>
  );
}
