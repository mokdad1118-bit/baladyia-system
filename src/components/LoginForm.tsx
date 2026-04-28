"use client";

import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { Input, FieldLabel, FieldGroup } from "@/components/ui/field";
import { Button } from "@/components/ui/button";

export function LoginForm() {
  const router = useRouter();
  const sp = useSearchParams();
  const [err, setErr] = useState<string | null>(null);
  const [pend, setPend] = useState(false);
  return (
    <form
      className="space-y-4"
      onSubmit={async (e) => {
        e.preventDefault();
        setPend(true);
        setErr(null);
        const fd = new FormData(e.currentTarget);
        const res = await signIn("credentials", {
          identifier: String(fd.get("identifier") ?? "").trim(),
          password: String(fd.get("password")),
          redirect: false,
        });
        setPend(false);
        if (res?.error) {
          setErr("بيانات غير صحيحة");
          return;
        }
        const after = sp.get("next");
        if (after?.startsWith("/") && !after.startsWith("//")) {
          router.push(after);
          router.refresh();
          return;
        }
        router.push("/after-login");
        router.refresh();
      }}
    >
      {err && (
        <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-800">{err}</p>
      )}
      {sp.get("registered") && (
        <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
          تم إنشاء الحساب — يمكنك تسجيل الدخول الآن
        </p>
      )}
      <FieldGroup>
        <FieldLabel>البريد الإلكتروني (موظف/مدير) أو رقم واتساب (مواطن)</FieldLabel>
        <Input
          name="identifier"
          type="text"
          required
          autoComplete="username"
          placeholder="name@org.local أو 9639XXXXXXXX"
        />
      </FieldGroup>
      <FieldGroup>
        <FieldLabel>كلمة المرور</FieldLabel>
        <Input name="password" type="password" required autoComplete="current-password" />
      </FieldGroup>
      <Button className="w-full" type="submit" size="lg" disabled={pend}>
        {pend ? "جاري الاتصال…" : "تسجيل الدخول"}
      </Button>
    </form>
  );
}
