"use client";

import { useActionState, useMemo, useState } from "react";
import { UserRole } from "@/generated/prisma/enums";
import { userRoleAr } from "@/lib/labels";
import { updateEmployeePermissions } from "@/actions/admin-users";
import { UserCreateForm } from "@/app/admin/(panel)/users/UserCreateForm";
import { ToggleForm } from "@/app/admin/(panel)/users/ToggleForm";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { Badge } from "@/components/ui/badge";
import { AdminListSearchField } from "@/components/admin/AdminListSearchField";

export type StaffUserRow = {
  id: string;
  name: string;
  email: string | null;
  notificationEmail: string | null;
  phone: string | null;
  role: UserRole;
  isActive: boolean;
  permViewRequests: boolean;
  permManageGas: boolean;
  permManageSocialServices: boolean;
  permManageCitizenFeedback: boolean;
  permViewCitizens: boolean;
  permViewOperationLog: boolean;
  permManageServices: boolean;
  permManageUsers: boolean;
  permViewStats: boolean;
};

function haystack(u: StaffUserRow): string {
  return [
    u.name,
    u.email,
    u.notificationEmail,
    u.phone,
    userRoleAr[u.role],
    u.permViewRequests ? "طلبات" : "",
    u.permManageGas ? "غاز" : "",
    u.permManageSocialServices ? "اجتماعية" : "",
    u.permManageCitizenFeedback ? "شكاوى" : "",
    u.permViewCitizens ? "مواطنون" : "",
    u.permViewOperationLog ? "سجل عمليات" : "",
    u.permManageServices ? "خدمات" : "",
    u.permManageUsers ? "موظفون" : "",
    u.permViewStats ? "إحصائيات" : "",
    u.isActive ? "" : "معطّل",
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

const permissionOptions = [
  { name: "permViewRequests", key: "requests", label: "طلبات المدينة", valueKey: "permViewRequests" },
  { name: "permManageGas", key: "gas", label: "الغاز", valueKey: "permManageGas" },
  { name: "permManageSocialServices", key: "social", label: "الخدمات الاجتماعية", valueKey: "permManageSocialServices" },
  { name: "permManageCitizenFeedback", key: "feedback", label: "الشكاوى", valueKey: "permManageCitizenFeedback" },
  { name: "permViewCitizens", key: "citizens", label: "المواطنون", valueKey: "permViewCitizens" },
  { name: "permViewOperationLog", key: "operationLog", label: "سجل العمليات", valueKey: "permViewOperationLog" },
  { name: "permManageServices", key: "services", label: "الخدمات", valueKey: "permManageServices" },
  { name: "permManageUsers", key: "users", label: "الموظفون", valueKey: "permManageUsers" },
  { name: "permViewStats", key: "stats", label: "الإحصائيات", valueKey: "permViewStats" },
] as const;

function PermissionBadge({ children }: { children: React.ReactNode }) {
  return (
    <Badge className="border-emerald-200/80 bg-emerald-50/80 font-normal text-emerald-900">
      {children}
    </Badge>
  );
}

function EmployeePermissionsForm({
  user,
  assignablePerms,
}: {
  user: StaffUserRow;
  assignablePerms: { requests: boolean; gas: boolean; social: boolean; feedback: boolean; citizens: boolean; operationLog: boolean; services: boolean; users: boolean; stats: boolean };
}) {
  const [state, action] = useActionState(updateEmployeePermissions, undefined);
  return (
    <form action={action} className="mt-3 border-t border-slate-100 pt-3">
      <input type="hidden" name="userId" value={user.id} />
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        {permissionOptions.map((p) => {
          const enabled = assignablePerms[p.key];
          const checked = Boolean(user[p.valueKey]);
          return (
            <label
              key={p.name}
              className={`flex items-center gap-2 text-xs ${enabled ? "cursor-pointer text-slate-700" : "cursor-not-allowed text-slate-400"}`}
            >
              <input
                type="checkbox"
                name={p.name}
                defaultChecked={checked}
                disabled={!enabled}
                className="size-3.5"
              />
              <span>{p.label}</span>
            </label>
          );
        })}
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <button
          type="submit"
          className="rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-800 transition hover:border-emerald-300 hover:bg-emerald-50"
        >
          حفظ الصلاحيات
        </button>
        {state?.error ? <span className="text-xs text-rose-700">{state.error}</span> : null}
        {state && "ok" in state && state.ok ? <span className="text-xs text-emerald-700">تم الحفظ</span> : null}
      </div>
    </form>
  );
}

export function StaffUsersListWithSearch({
  users,
  municipalities = [],
  isSuperAdmin = false,
  isFullAdmin,
  assignablePerms,
}: {
  users: StaffUserRow[];
  municipalities?: { id: string; name: string }[];
  isSuperAdmin?: boolean;
  isFullAdmin: boolean;
  assignablePerms: { requests: boolean; gas: boolean; social: boolean; feedback: boolean; citizens: boolean; operationLog: boolean; services: boolean; users: boolean; stats: boolean };
}) {
  const [q, setQ] = useState("");
  const filtered = useMemo(() => {
    const n = q.trim().toLowerCase();
    if (!n) return users;
    return users.filter((u) => haystack(u).includes(n));
  }, [users, q]);

  return (
    <div className="space-y-8">
      <div>
        <PageHeader
          className="!mb-4"
          title="حسابات الموظفين"
          description="إنشاء وتعديل حالة حسابات الموظفين والمديرين — حسابات المواطنين في قائمة منفصلة."
        />
        <Card className="max-w-xl">
          <CardHeader>
            <CardTitle className="!text-base">مستخدم جديد (موظف/مدير)</CardTitle>
            <CardDescription>لن تُرسل بيانات الدخول بريدياً — شاركها بأمان خارج النظام.</CardDescription>
          </CardHeader>
          <CardContent>
            <UserCreateForm
              isSuperAdmin={isSuperAdmin}
              isFullAdmin={isFullAdmin}
              assignablePerms={assignablePerms}
              municipalities={municipalities}
            />
          </CardContent>
        </Card>
      </div>
      <div>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">القائمة</h2>
        <AdminListSearchField
          id="admin-staff-users-search"
          label="بحث في قائمة الموظفين"
          placeholder="الاسم، البريد، الواتساب، الدور…"
          value={q}
          onChange={setQ}
          className="mb-4"
        />
        {users.length === 0 ? (
          <p className="text-center text-sm text-[var(--gov-muted)]">لا مستخدمين.</p>
        ) : filtered.length === 0 ? (
          <p className="text-center text-sm text-[var(--gov-muted)]">لا نتائج مطابقة للبحث.</p>
        ) : (
          <ul className="space-y-2">
            {filtered.map((u) => (
              <li key={u.id}>
                <Card>
                  <CardContent className="!py-3">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="font-medium text-slate-900">{u.name}</p>
                        <p className="text-sm text-slate-500">
                          {u.email || u.notificationEmail || (u.phone ? `واتساب ${u.phone}` : "—")}
                        </p>
                        <p className="mt-1 flex flex-wrap items-center gap-1">
                          <Badge>{userRoleAr[u.role]}</Badge>
                          {u.role === UserRole.EMPLOYEE ? (
                            <>
                              {permissionOptions.map((p) =>
                                u[p.valueKey] ? <PermissionBadge key={p.name}>{p.label}</PermissionBadge> : null,
                              )}
                            </>
                          ) : null}
                          {!u.isActive && (
                            <Badge className="border-rose-200/80 bg-rose-50 text-rose-800">معطّل</Badge>
                          )}
                        </p>
                      </div>
                      <ToggleForm userId={u.id} isActive={u.isActive} />
                    </div>
                    {u.role === UserRole.EMPLOYEE ? (
                      <EmployeePermissionsForm user={u} assignablePerms={assignablePerms} />
                    ) : null}
                  </CardContent>
                </Card>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
