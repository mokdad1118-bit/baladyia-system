import { db } from "@/lib/db";
import { userRoleAr } from "@/lib/labels";
import { ToggleForm } from "../users/ToggleForm";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { Badge } from "@/components/ui/badge";
import { auth } from "@/auth";
import { requireAdminPanel } from "@/lib/admin-guard";
import { UserRole } from "@/generated/prisma/enums";

/** حسابات المواطنين فقط — منفصلة عن صفحة حسابات الموظفين */
export default async function AdminCitizensPage() {
  const s = await auth();
  await requireAdminPanel(s);
  const isAdmin = s!.user!.role === UserRole.ADMIN;

  const citizens = await db.user.findMany({
    where: { role: UserRole.CITIZEN },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-8">
      <PageHeader className="!mb-4" title="حسابات المواطنين" />
      <div>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">القائمة</h2>
        {citizens.length === 0 ? (
          <p className="text-center text-sm text-[var(--gov-muted)]">لا يوجد مواطنون مسجّلون بعد.</p>
        ) : (
          <ul className="space-y-2">
            {citizens.map((u) => (
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
                      {isAdmin ? <ToggleForm userId={u.id} isActive={u.isActive} /> : null}
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
