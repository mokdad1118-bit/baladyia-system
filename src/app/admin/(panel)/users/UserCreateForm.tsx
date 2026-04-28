"use client";

import { useActionState } from "react";
import { createStaffUser } from "@/actions/admin-users";
import { UserRole } from "@/generated/prisma/enums";
import { Input, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Button } from "@/components/ui/button";

export function UserCreateForm() {
  const [st, act] = useActionState(createStaffUser, undefined);
  return (
    <form action={act} className="space-y-4 max-w-md">
      {st?.error && <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-800">{st.error}</p>}
      {st && "ok" in st && st.ok && (
        <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800">تم إنشاء الحساب</p>
      )}
      <FieldGroup>
        <FieldLabel>الاسم</FieldLabel>
        <Input name="name" placeholder="مثال: بيان" required autoComplete="name" />
      </FieldGroup>
      <FieldGroup>
        <FieldLabel>البريد</FieldLabel>
        <Input name="email" type="email" required autoComplete="email" />
      </FieldGroup>
      <FieldGroup>
        <FieldLabel>كلمة المرور</FieldLabel>
        <Input name="password" type="password" required minLength={6} autoComplete="new-password" />
      </FieldGroup>
      <FieldGroup>
        <FieldLabel>الدور</FieldLabel>
        <select
          className="w-full rounded-xl border border-slate-200/90 bg-white px-3 py-2.5 text-sm"
          name="role"
          defaultValue="EMPLOYEE"
        >
          <option value={UserRole.EMPLOYEE}>موظف</option>
          <option value={UserRole.ADMIN}>مدير نظام</option>
        </select>
      </FieldGroup>
      <Button type="submit" className="w-full" size="lg">
        إضافة مستخدم
      </Button>
    </form>
  );
}
