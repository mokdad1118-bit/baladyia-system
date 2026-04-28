import { db } from "@/lib/db";
import { userRoleAr } from "@/lib/labels";
import { UserCreateForm } from "./UserCreateForm";
import { ToggleForm } from "./ToggleForm";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { Badge } from "@/components/ui/badge";
import { auth } from "@/auth";
import { requireAdminRole } from "@/lib/admin-guard";
import { UserRole } from "@/generated/prisma/enums";

export default async function AdminStaffUsersPage() {
  await requireAdminRole(await auth());
  const users = await db.user.findMany({
    where: { role: { in: [UserRole.EMPLOYEE, UserRole.ADMIN] } },
    orderBy: { createdAt: "desc" },
  });
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
            <UserCreateForm />
          </CardContent>
        </Card>
      </div>
      <div>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">القائمة</h2>
        <ul className="space-y-2">
          {users.map((u) => (
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
      </div>
    </div>
  );
}
