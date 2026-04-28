import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { UserRole } from "@/generated/prisma/enums";
import { GovLoginPage } from "@/components/gov/GovLoginPage";

/** دخول المواطنين فقط — مسار منفصل عن /admin/login */
export default async function CitizenLoginPage() {
  const s = await auth();
  if (s?.user?.role === UserRole.CITIZEN) redirect("/citizen");
  if (s?.user?.role === UserRole.EMPLOYEE || s?.user?.role === UserRole.ADMIN) redirect("/admin");

  return (
    <GovLoginPage
      portal="citizen"
      subtitle="تسجيل الدخول"
      identifierLabel="رقم الهاتف (واتساب)"
      identifierPlaceholder="9639xxxxxxxx"
      identifierAutocomplete="tel"
    />
  );
}
