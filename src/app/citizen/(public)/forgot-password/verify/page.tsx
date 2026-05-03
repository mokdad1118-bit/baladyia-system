"use client";

import Link from "next/link";
import { StateEmblem } from "@/components/gov/StateEmblem";
import { ENTITY_NAME_AR, PORTAL_SUBTITLE } from "@/lib/entity";
import { CitizenOtpForm } from "@/components/citizen/CitizenOtpForm";
import { resendPasswordResetOtpAction, verifyPasswordResetOtpAction } from "@/actions/citizen-auth";

export default function ForgotPasswordVerifyPage() {
  return (
    <div className="gov-page flex min-h-dvh flex-col">
      <header className="gov-header">
        <div className="mx-auto flex max-w-3xl flex-wrap items-center justify-center gap-4 px-4 py-5 sm:justify-between">
          <div className="flex items-center gap-3">
            <StateEmblem height={58} />
            <div className="text-start text-white">
              <p className="text-xs text-white/80">{PORTAL_SUBTITLE}</p>
              <p className="text-lg font-bold">{ENTITY_NAME_AR}</p>
              <p className="text-sm text-white/90">رمز التحقق</p>
            </div>
          </div>
        </div>
      </header>
      <main className="flex flex-1 justify-center px-4 py-10">
        <CitizenOtpForm
          title="إدخال رمز التحقق"
          description="أدخل الرمز المكوّن من ٦ أرقام المرسل إلى بريدك الإلكتروني المسجّل. صلاحية الرمز ١٠ دقائق."
          verifyAction={verifyPasswordResetOtpAction}
          resendAction={resendPasswordResetOtpAction}
          successRedirectHref="/citizen/forgot-password/new-password"
          loginHref="/citizen/login"
          variant="gov"
        />
      </main>
      <p className="pb-6 text-center text-xs">
        <Link href="/citizen/forgot-password" className="text-[var(--gov-muted)] hover:underline">
          طلب رمز جديد
        </Link>
      </p>
    </div>
  );
}
