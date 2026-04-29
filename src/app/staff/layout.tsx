import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { UserRole } from "@/generated/prisma/enums";
import { StaffNav } from "@/components/staff/StaffNav";
import { WorkspaceShell } from "@/components/WorkspaceShell";
import { staffNavPermissions } from "@/lib/staff-permissions";

export default async function StaffLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const s = await auth();
  if (!s?.user) redirect("/login?next=/staff/requests");
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
