import { headers } from "next/headers";
import { GovLoginPage } from "@/components/gov/GovLoginPage";
import {
  isStaffPortalHostname,
  requestOriginFromHeaders,
  staffPortalSplitDisabledForOrigin,
  staffPortalSplitEnabled,
} from "@/lib/staff-portal";

/** دخول المدير والموظف — /admin/login */
export default async function AdminStaffLoginPage() {
  const h = await headers();
  const host = h.get("host");
  const origin = requestOriginFromHeaders(h);
  const splitOff = staffPortalSplitDisabledForOrigin(origin, host);
  const staffPortalWeb =
    staffPortalSplitEnabled() && !splitOff && isStaffPortalHostname(host);

  return (
    <GovLoginPage
      loginPage="admin"
      title="لوحة التحكم — دخول الإدارة والموظفين"
      subtitle="تسجيل دخول المدير أو الموظف"
      identifierLabel="البريد الإلكتروني"
      identifierPlaceholder="employee@example.local"
      identifierAutocomplete="username"
      staffPortalWeb={staffPortalWeb}
    />
  );
}
