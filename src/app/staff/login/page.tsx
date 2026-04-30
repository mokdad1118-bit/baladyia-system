import { GovLoginPage } from "@/components/gov/GovLoginPage";

export default function StaffLoginPage() {
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
