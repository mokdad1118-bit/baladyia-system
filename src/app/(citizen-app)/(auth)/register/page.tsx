"use client";

import { CitizenAuthShell } from "@/components/citizen/CitizenAuthShell";
import { CitizenRegisterForm } from "@/components/citizen/CitizenRegisterForm";

export default function CitizenRegisterPage() {
  return (
    <CitizenAuthShell headerAside={<p className="text-sm font-semibold text-emerald-900">إنشاء حساب جديد</p>}>
      <main className="flex flex-1 justify-center px-4 py-10">
        <CitizenRegisterForm
          verifyHref="/register/verify"
          loginHref="/citizen/login"
          variant="emerald"
        />
      </main>
    </CitizenAuthShell>
  );
}
