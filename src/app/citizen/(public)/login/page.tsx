import { GovLoginPage } from "@/components/gov/GovLoginPage";

export default function CitizenLoginPage() {
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
