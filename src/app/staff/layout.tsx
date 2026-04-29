import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { UserRole } from "@/generated/prisma/enums";
import { StaffNav } from "@/components/staff/StaffNav";
import { WorkspaceShell } from "@/components/WorkspaceShell";
import { staffNavPermissions } from "@/lib/staff-permissions";
import { staffUnauthenticatedLoginPath } from "@/lib/staff-portal";

export default async function StaffLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const s = await auth();
  const h = await headers();
  if (!s?.user) {
    redirect(staffUnauthenticatedLoginPath(h.get("host"), "/staff/requests"));
  }
  if (s.user.role !== UserRole.EMPLOYEE && s.user.role !== UserRole.ADMIN) {
    redirect("/");
  }
  const p = staffNavPermissions(s);
  const showAdminNav =
    s.user.role === UserRole.ADMIN || p.manageServices || p.manageUsers || p.viewStats;
  return (
    <WorkspaceShell
      title="فضاء الموظف"
      nav={<StaffNav showAdmin={showAdminNav} />}
    >
      {children}
    </WorkspaceShell>
  );
}
