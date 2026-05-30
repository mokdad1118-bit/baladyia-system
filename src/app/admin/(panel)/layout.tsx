import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { UserRole } from "@/generated/prisma/enums";
import { AdminNav } from "@/components/admin/AdminNav";
import { AdminCurrentMunicipalityLabel, AdminSuperMunicipalitySwitcher } from "@/components/admin/AdminMunicipalityHeader";
import { AdminNoPwaCacheReset } from "@/components/admin/AdminNoPwaCacheReset";
import { db } from "@/lib/db";
import { hasAnyStaffPanelPermission, staffNavPermissions } from "@/lib/staff-permissions";
import { GovWorkspaceShell } from "@/components/gov/GovWorkspaceShell";
import {
  citizenPortalOrigin,
  isStaffPortalHostname,
  requestOriginFromHeaders,
  staffPortalSplitDisabledForOrigin,
  staffPortalSplitEnabled,
} from "@/lib/staff-portal";
import { ADMIN_NAV_BADGE_NOTIFICATION_TYPES } from "@/lib/admin-nav-badges";
import { isSuperAdminRole } from "@/lib/roles";

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
  if (s.user.role === UserRole.EMPLOYEE && !hasAnyStaffPanelPermission(s)) redirect("/staff");
  if (
    s.user.role !== UserRole.SUPER_ADMIN &&
    s.user.role !== UserRole.MUNICIPALITY_ADMIN &&
    s.user.role !== UserRole.EMPLOYEE
  ) {
    redirect("/citizen/welcome");
  }
  const staffPerms = staffNavPermissions(s);
  const uid = s.user.id;
  const [cityServiceRequests, gas, social, feedback] = await Promise.all([
    db.notification.count({
      where: { userId: uid, read: false, type: { in: [...ADMIN_NAV_BADGE_NOTIFICATION_TYPES.cityServiceRequests] } },
    }),
    db.notification.count({
      where: { userId: uid, read: false, type: { in: [...ADMIN_NAV_BADGE_NOTIFICATION_TYPES.gas] } },
    }),
    db.notification.count({
      where: { userId: uid, read: false, type: { in: [...ADMIN_NAV_BADGE_NOTIFICATION_TYPES.social] } },
    }),
    db.notification.count({
      where: { userId: uid, read: false, type: { in: [...ADMIN_NAV_BADGE_NOTIFICATION_TYPES.feedback] } },
    }),
  ]);
  const badgeCounts = { cityServiceRequests, gas, social, feedback };
  const homeHref = staffRoot ? "/" : "/admin";
  const logoutCallbackUrl = "/admin/login";
  return (
    <GovWorkspaceShell
      portalTitle="لوحة التحكم"
      nav={
        <AdminNav
          staffPerms={staffPerms}
          staffRoot={staffRoot}
          badgeCounts={badgeCounts}
          isSuperAdmin={isSuperAdminRole(s.user.role)}
          isAdminManager={s.user.role === UserRole.SUPER_ADMIN || s.user.role === UserRole.MUNICIPALITY_ADMIN}
        />
      }
      homeHref={homeHref}
      logoutCallbackUrl={logoutCallbackUrl}
    >
      <AdminNoPwaCacheReset />
      <AdminSuperMunicipalitySwitcher />
      <AdminCurrentMunicipalityLabel />
      {children}
    </GovWorkspaceShell>
  );
}
