import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { UserRole } from "@/generated/prisma/enums";
import { GovLoginPage } from "@/components/gov/GovLoginPage";

export default async function EmployeeLoginPage() {
  const s = await auth();
  if (s?.user?.role === UserRole.EMPLOYEE) redirect("/employee");
  if (s?.user?.role === UserRole.ADMIN) redirect("/admin");
  if (s?.user?.role === UserRole.CITIZEN) redirect("/citizen");
  return (
    <GovLoginPage
      loginPage="staff"
      title="بوابة الموظف"
      subtitle="تسجيل دخول الموظفين"
      identifierLabel="البريد الإلكتروني"
      identifierPlaceholder="employee@org.local"
      identifierAutocomplete="username"
    />
  );
}
