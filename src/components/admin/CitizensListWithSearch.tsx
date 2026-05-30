"use client";

import { useMemo, useState } from "react";
import { UserRole } from "@/generated/prisma/enums";
import { userRoleAr } from "@/lib/labels";
import { ToggleForm } from "@/app/admin/(panel)/users/ToggleForm";
import { DeleteCitizenButton } from "@/components/admin/DeleteCitizenButton";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { Badge } from "@/components/ui/badge";
import { AdminListSearchField } from "@/components/admin/AdminListSearchField";

export type CitizenRow = {
  id: string;
  name: string;
  email: string | null;
  notificationEmail: string | null;
  phone: string | null;
  nationalId: string | null;
  municipalityName: string | null;
  isVerified: boolean;
  role: UserRole;
  isActive: boolean;
};

function haystack(u: CitizenRow): string {
  return [
    u.name,
    u.email,
    u.notificationEmail,
    u.phone,
    u.nationalId,
    u.municipalityName,
    userRoleAr[u.role],
    u.isActive ? "" : "معطّل",
    u.isVerified ? "" : "غير مُفعّل",
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

export function CitizensListWithSearch({
  citizens,
  isAdmin,
}: {
  citizens: CitizenRow[];
  isAdmin: boolean;
}) {
  const [q, setQ] = useState("");
  const filtered = useMemo(() => {
    const n = q.trim().toLowerCase();
    if (!n) return citizens;
    return citizens.filter((u) => haystack(u).includes(n));
  }, [citizens, q]);

  return (
    <div className="space-y-8">
      <PageHeader className="!mb-4" title="حسابات المواطنين" />
      <div>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">القائمة</h2>
        <AdminListSearchField
          id="admin-citizens-search"
          label="بحث في قائمة المواطنين"
          placeholder="الاسم، البريد، الهاتف، الرقم الوطني…"
          value={q}
          onChange={setQ}
          className="mb-4"
        />
        {citizens.length === 0 ? (
          <p className="text-center text-sm text-[var(--gov-muted)]">لا يوجد مواطنون مسجّلون بعد.</p>
        ) : filtered.length === 0 ? (
          <p className="text-center text-sm text-[var(--gov-muted)]">لا نتائج مطابقة للبحث.</p>
        ) : (
          <ul className="space-y-2">
            {filtered.map((u) => (
              <li key={u.id}>
                <Card>
                  <CardContent className="!py-3">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <div className="min-w-0 space-y-1">
                        <p className="font-medium text-slate-900">{u.name}</p>
                        <dl className="text-sm text-slate-600">
                          <div className="flex flex-wrap gap-x-3 gap-y-0.5">
                            <dt className="font-medium text-slate-500">البريد</dt>
                            <dd className="min-w-0 break-all">{u.email ?? "—"}</dd>
                          </div>
                          {u.notificationEmail &&
                          u.notificationEmail !== (u.email ?? "").trim() ? (
                            <div className="flex flex-wrap gap-x-3 gap-y-0.5">
                              <dt className="font-medium text-slate-500">بريد الإشعارات</dt>
                              <dd className="min-w-0 break-all">{u.notificationEmail}</dd>
                            </div>
                          ) : null}
                          <div className="flex flex-wrap gap-x-3 gap-y-0.5">
                            <dt className="font-medium text-slate-500">البلدية</dt>
                            <dd className="min-w-0">{u.municipalityName ?? "—"}</dd>
                          </div>
                          <div className="flex flex-wrap gap-x-3 gap-y-0.5">
                            <dt className="font-medium text-slate-500">الهاتف</dt>
                            <dd dir="ltr" className="min-w-0 text-start">
                              {u.phone ?? "—"}
                            </dd>
                          </div>
                          <div className="flex flex-wrap gap-x-3 gap-y-0.5">
                            <dt className="font-medium text-slate-500">الرقم الوطني</dt>
                            <dd dir="ltr" className="min-w-0 text-start">
                              {u.nationalId ?? "—"}
                            </dd>
                          </div>
                        </dl>
                        <p className="mt-1 flex flex-wrap items-center gap-1">
                          <Badge>{userRoleAr[u.role]}</Badge>
                          {!u.isVerified && (
                            <Badge className="border-amber-200/80 bg-amber-50 text-amber-900">
                              بريد غير مُفعّل
                            </Badge>
                          )}
                          {!u.isActive && (
                            <Badge className="border-rose-200/80 bg-rose-50 text-rose-800">معطّل</Badge>
                          )}
                        </p>
                      </div>
                      {isAdmin ? (
                        <div className="flex shrink-0 flex-col items-stretch gap-2 sm:items-end">
                          <ToggleForm userId={u.id} isActive={u.isActive} />
                          <DeleteCitizenButton userId={u.id} name={u.name} />
                        </div>
                      ) : null}
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
