import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { UserRole } from "@/generated/prisma/enums";
import { StaffNav } from "@/components/staff/StaffNav";
import { WorkspaceShell } from "@/components/WorkspaceShell";

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
  return (
    <WorkspaceShell
      title="فضاء الموظف"
      nav={<StaffNav showAdmin={s.user.role === UserRole.ADMIN} />}
    >
      {children}
    </WorkspaceShell>
  );
}
