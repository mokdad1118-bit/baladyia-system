import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { UserRole } from "@/generated/prisma/enums";
import { GovLoginPage } from "@/components/gov/GovLoginPage";

export default async function CitizenLoginPage() {
  const s = await auth();
  if (s?.user?.role === UserRole.CITIZEN) redirect("/citizen");
  if (s?.user?.role === UserRole.EMPLOYEE) redirect("/employee");
  if (s?.user?.role === UserRole.ADMIN) redirect("/admin");

  return (
    <GovLoginPage
      loginPage="citizen"
      subtitle="تسجيل الدخول"
      identifierLabel="رقم الهاتف (واتساب)"
      identifierPlaceholder="9639xxxxxxxx"
      identifierAutocomplete="tel"
    />
  );
}
