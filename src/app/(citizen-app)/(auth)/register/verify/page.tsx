"use client";

import { CitizenAuthShell } from "@/components/citizen/CitizenAuthShell";
import { CitizenOtpForm } from "@/components/citizen/CitizenOtpForm";
import { resendVerificationOtpAction, verifyCitizenEmailAction } from "@/actions/citizen-auth";

export default function VerifyEmailPage() {
  return (
    <CitizenAuthShell headerAside={<p className="text-sm font-semibold text-emerald-900">تفعيل الحساب</p>}>
      <main className="flex flex-1 justify-center px-4 py-10">
        <CitizenOtpForm
          title="تفعيل الحساب"
          description="أدخل الرمز المكوّن من ٦ أرقام المرسل إلى بريدك الإلكتروني. صلاحية الرمز ١٠ دقائق."
          verifyAction={verifyCitizenEmailAction}
          resendAction={resendVerificationOtpAction}
          successRedirectHref="/citizen/login?verified=1"
          loginHref="/citizen/login"
          variant="emerald"
        />
      </main>
    </CitizenAuthShell>
  );
}
