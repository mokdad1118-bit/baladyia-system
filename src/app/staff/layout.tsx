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
  if (!s?.user) {
    redirect("/staff/login?next=/staff/requests");
  }
  if (s.user.role === UserRole.CITIZEN) redirect("/citizen");
  if (s.user.role === UserRole.SUPER_ADMIN || s.user.role === UserRole.MUNICIPALITY_ADMIN) redirect("/admin");
  if (s.user.role !== UserRole.EMPLOYEE) {
    redirect("/citizen/welcome");
  }
  const p = staffNavPermissions(s);
  return (
    <WorkspaceShell
      title="فضاء الموظف"
      nav={<StaffNav showAdmin={p.manageServices || p.manageUsers || p.viewStats} />}
    >
      {children}
    </WorkspaceShell>
  );
}
