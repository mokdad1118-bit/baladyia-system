import { headers } from "next/headers";

import { auth } from "@/auth";

import { redirect } from "next/navigation";

import { UserRole } from "@/generated/prisma/enums";

import { GovLoginPage } from "@/components/gov/GovLoginPage";

import { citizenPortalOrigin, isStaffPortalHostname, staffPanelHomePath, staffPortalSplitEnabled } from "@/lib/staff-portal";



/** دخول الموظفين والمديرين فقط — مسار منفصل عن /login */

export default async function AdminStaffLoginPage() {

  const s = await auth();

  const host = (await headers()).get("host");

  const staffPortalWeb = staffPortalSplitEnabled() && isStaffPortalHostname(host);

  if (s?.user?.role === UserRole.ADMIN || s?.user?.role === UserRole.EMPLOYEE) {

    redirect(staffPanelHomePath(host));

  }

  if (s?.user?.role === UserRole.CITIZEN) redirect(citizenPortalOrigin() ?? "/");

  return (

    <GovLoginPage

      portal="staff"

      title="لوحة التحكم — دخول الموظفين"

      subtitle="تسجيل دخول الموظفين ومدير النظام"

      identifierLabel="البريد الإلكتروني"

      identifierPlaceholder="employee@example.local"

      identifierAutocomplete="username"

      staffPortalWeb={staffPortalWeb}

    />

  );

}

