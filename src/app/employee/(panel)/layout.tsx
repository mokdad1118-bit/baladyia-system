import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { UserRole } from "@/generated/prisma/enums";
import { GovWorkspaceShell } from "@/components/gov/GovWorkspaceShell";
import { EmployeeNav } from "@/components/employee/EmployeeNav";

export default async function EmployeePanelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const s = await auth();
  if (!s?.user) redirect("/employee/login?next=/employee");
  if (s.user.role === UserRole.CITIZEN) redirect("/citizen");
  if (s.user.role === UserRole.ADMIN) redirect("/admin");
  if (s.user.role !== UserRole.EMPLOYEE) redirect("/");
  return (
    <GovWorkspaceShell portalTitle="بوابة الموظف" nav={<EmployeeNav />}>
      {children}
    </GovWorkspaceShell>
  );
}
