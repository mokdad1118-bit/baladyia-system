"use client";

import { useMemo, useState } from "react";
import { RequestStatus } from "@/generated/prisma/enums";
import { requestStatusAr } from "@/lib/labels";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { AdminListSearchField } from "@/components/admin/AdminListSearchField";

export function StatsListsWithSearch({
  total,
  completed,
  byStatus,
  byService,
}: {
  total: number;
  completed: number;
  byStatus: { status: RequestStatus; count: number }[];
  byService: { id: string; name: string; count: number }[];
}) {
  const [qStatus, setQStatus] = useState("");
  const [qService, setQService] = useState("");

  const filteredStatus = useMemo(() => {
    const n = qStatus.trim().toLowerCase();
    if (!n) return byStatus;
    return byStatus.filter((row) => {
      const label = requestStatusAr[row.status].toLowerCase();
      return label.includes(n) || String(row.count).includes(n);
    });
  }, [byStatus, qStatus]);

  const filteredService = useMemo(() => {
    const n = qService.trim().toLowerCase();
    if (!n) return byService;
    return byService.filter(
      (row) => row.name.toLowerCase().includes(n) || String(row.count).includes(n),
    );
  }, [byService, qService]);

  return (
    <div>
      <PageHeader title="الإحصائيات" />
      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardContent className="!pt-6">
            <p className="text-sm font-medium text-slate-500">إجمالي الطلبات</p>
            <p className="mt-1 text-3xl font-bold tabular-nums text-slate-900">{total}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="!pt-6">
            <p className="text-sm font-medium text-slate-500">مكتمل</p>
            <p className="mt-1 text-3xl font-bold tabular-nums text-emerald-900">{completed}</p>
          </CardContent>
        </Card>
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardContent className="!pt-6">
            <h2 className="text-sm font-semibold text-slate-900">حسب الحالة</h2>
            <AdminListSearchField
              id="admin-stats-status-search"
              label="بحث في قائمة الحالات"
              placeholder="اسم الحالة أو العدد…"
              value={qStatus}
              onChange={setQStatus}
              className="mt-3"
            />
            <ul className="mt-3 space-y-2 text-sm text-slate-600">
              {filteredStatus.map((row) => (
                <li key={row.status} className="flex justify-between gap-2">
                  <span>{requestStatusAr[row.status]}</span>
                  <span className="font-mono font-medium tabular-nums text-slate-900">{row.count}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="!pt-6">
            <h2 className="text-sm font-semibold text-slate-900">حسب الخدمة</h2>
            <AdminListSearchField
              id="admin-stats-service-search"
              label="بحث في قائمة الخدمات"
              placeholder="اسم الخدمة أو عدد الطلبات…"
              value={qService}
              onChange={setQService}
              className="mt-3"
            />
            <ul className="mt-3 space-y-2 text-sm text-slate-600">
              {filteredService.map((s) => (
                <li key={s.id} className="flex justify-between gap-2">
                  <span className="truncate">{s.name}</span>
                  <span className="shrink-0 font-mono tabular-nums text-slate-900">{s.count}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
