"use client";

import { useMemo, useState } from "react";
import { UserRole } from "@/generated/prisma/enums";
import { userRoleAr } from "@/lib/labels";
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
    u.permManageServices ? "خدمات" : "",
    u.permManageUsers ? "موظفون" : "",
    u.permViewStats ? "إحصائيات" : "",
    u.isActive ? "" : "معطّل",
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
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
  assignablePerms: { services: boolean; users: boolean; stats: boolean };
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
                              {u.permManageServices ? (
                                <Badge className="border-emerald-200/80 bg-emerald-50/80 font-normal text-emerald-900">
                                  خدمات
                                </Badge>
                              ) : null}
                              {u.permManageUsers ? (
                                <Badge className="border-sky-200/80 bg-sky-50/80 font-normal text-sky-900">
                                  موظفون
                                </Badge>
                              ) : null}
                              {u.permViewStats ? (
                                <Badge className="border-violet-200/80 bg-violet-50/80 font-normal text-violet-900">
                                  إحصائيات
                                </Badge>
                              ) : null}
                            </>
                          ) : null}
                          {!u.isActive && (
                            <Badge className="border-rose-200/80 bg-rose-50 text-rose-800">معطّل</Badge>
                          )}
                        </p>
                      </div>
                      <ToggleForm userId={u.id} isActive={u.isActive} />
                    </div>
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
