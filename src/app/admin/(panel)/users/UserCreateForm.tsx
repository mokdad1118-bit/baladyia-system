"use client";

import { useActionState, useState } from "react";
import { createStaffUser } from "@/actions/admin-users";
import { UserRole } from "@/generated/prisma/enums";
import { Input, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Button } from "@/components/ui/button";

type Assignable = { services: boolean; users: boolean; stats: boolean };

export function UserCreateForm({
  isFullAdmin,
  assignablePerms,
}: {
  isFullAdmin: boolean;
  assignablePerms: Assignable;
}) {
  const [st, act] = useActionState(createStaffUser, undefined);
  const [role, setRole] = useState<string>(UserRole.EMPLOYEE);
  const showEmployeePerms = role === UserRole.EMPLOYEE;
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
          value={role}
          onChange={(e) => setRole(e.target.value)}
        >
          <option value={UserRole.EMPLOYEE}>موظف</option>
          {isFullAdmin ? <option value={UserRole.ADMIN}>مدير نظام</option> : null}
        </select>
      </FieldGroup>
      {showEmployeePerms ? (
        <fieldset className="space-y-2 rounded-xl border border-slate-200/90 bg-slate-50/50 p-3">
          <legend className="px-1 text-sm font-semibold text-slate-800">صلاحيات الموظف في اللوحة</legend>
          <p className="text-xs text-slate-500">يجب تفعيل صلاحية واحدة على الأقل.</p>
          <label
            className={`flex items-start gap-2 text-sm ${assignablePerms.services ? "cursor-pointer" : "cursor-not-allowed opacity-50"}`}
          >
            <input
              type="checkbox"
              name="permManageServices"
              className="mt-0.5"
              disabled={!assignablePerms.services}
            />
            <span>إدارة الخدمات والنماذج والأسعار</span>
          </label>
          <label
            className={`flex items-start gap-2 text-sm ${assignablePerms.users ? "cursor-pointer" : "cursor-not-allowed opacity-50"}`}
          >
            <input
              type="checkbox"
              name="permManageUsers"
              className="mt-0.5"
              disabled={!assignablePerms.users}
            />
            <span>إدارة حسابات الموظفين والمديرين</span>
          </label>
          <label
            className={`flex items-start gap-2 text-sm ${assignablePerms.stats ? "cursor-pointer" : "cursor-not-allowed opacity-50"}`}
          >
            <input
              type="checkbox"
              name="permViewStats"
              className="mt-0.5"
              disabled={!assignablePerms.stats}
            />
            <span>عرض الإحصائيات والتقارير</span>
          </label>
        </fieldset>
      ) : (
        <p className="text-xs text-slate-500">مدير النظام يمتلك كافة الصلاحيات تلقائياً.</p>
      )}
      <Button type="submit" className="w-full" size="lg">
        إضافة مستخدم
      </Button>
    </form>
  );
}
