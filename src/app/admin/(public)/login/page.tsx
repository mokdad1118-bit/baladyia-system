import { headers } from "next/headers";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { UserRole } from "@/generated/prisma/enums";
import { GovLoginPage } from "@/components/gov/GovLoginPage";
import {
  citizenPortalOrigin,
  isStaffPortalHostname,
  requestOriginFromHeaders,
  staffPortalSplitDisabledForOrigin,
  staffPortalSplitEnabled,
} from "@/lib/staff-portal";

/** دخول مدير النظام فقط — /admin/login */
export default async function AdminStaffLoginPage() {
  const s = await auth();
  const h = await headers();
  const host = h.get("host");
  const origin = requestOriginFromHeaders(h);
  const splitOff = staffPortalSplitDisabledForOrigin(origin, host);
  const staffPortalWeb =
    staffPortalSplitEnabled() && !splitOff && isStaffPortalHostname(host);

  if (s?.user?.role === UserRole.ADMIN) redirect("/admin");
  if (s?.user?.role === UserRole.EMPLOYEE) redirect("/staff");
  if (s?.user?.role === UserRole.CITIZEN) redirect(citizenPortalOrigin() ?? "/");

  return (
    <GovLoginPage
      loginPage="admin"
      title="لوحة التحكم — دخول المدير"
      subtitle="تسجيل دخول مدير النظام"
      identifierLabel="البريد الإلكتروني"
      identifierPlaceholder="employee@example.local"
      identifierAutocomplete="username"
      staffPortalWeb={staffPortalWeb}
    />
  );
}
