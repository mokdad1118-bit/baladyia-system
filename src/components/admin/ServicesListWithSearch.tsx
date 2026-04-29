"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { DeactivateForm } from "@/app/admin/(panel)/services/DeactivateForm";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/ui/page-header";
import { cn } from "@/lib/cn";
import { AdminListSearchField } from "@/components/admin/AdminListSearchField";

export type ServiceRow = {
  id: string;
  name: string;
  price: string;
  isActive: boolean;
};

function haystack(s: ServiceRow): string {
  return [s.name, s.price, s.isActive ? "" : "غير مفعّل"].filter(Boolean).join(" ").toLowerCase();
}

export function ServicesListWithSearch({
  services,
  newHref,
  editHrefPrefix,
}: {
  services: ServiceRow[];
  newHref: string;
  /** مثال: /admin/services — لرابط التعديل */
  editHrefPrefix: string;
}) {
  const [q, setQ] = useState("");
  const filtered = useMemo(() => {
    const n = q.trim().toLowerCase();
    if (!n) return services;
    return services.filter((s) => haystack(s).includes(n));
  }, [services, q]);

  return (
    <div>
      <PageHeader
        title="الخدمات"
        actions={
          <Link
            className="inline-flex h-10 items-center justify-center rounded-xl bg-emerald-700 px-4 text-sm font-semibold text-white shadow-sm hover:bg-emerald-800"
            href={newHref}
          >
            + خدمة جديدة
          </Link>
        }
      />
      <AdminListSearchField
        id="admin-services-search"
        label="بحث في قائمة الخدمات"
        placeholder="اسم الخدمة، السعر، الحالة…"
        value={q}
        onChange={setQ}
        className="mb-4"
      />
      {services.length === 0 ? (
        <p className="text-center text-sm text-[var(--gov-muted)]">لا خدمات.</p>
      ) : filtered.length === 0 ? (
        <p className="text-center text-sm text-[var(--gov-muted)]">لا نتائج مطابقة للبحث.</p>
      ) : (
        <ul className="space-y-2">
          {filtered.map((s) => (
            <li key={s.id}>
              <Card
                className={cn(
                  "transition",
                  s.isActive ? "" : "opacity-75 ring-1 ring-slate-200/50",
                )}
              >
                <CardContent className="!py-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="font-semibold text-slate-900">{s.name}</h2>
                        {!s.isActive && <Badge>غير مفعّل</Badge>}
                      </div>
                      <p className="text-sm text-slate-500">{s.price} ل.س</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Link
                        className="inline-flex h-9 items-center justify-center rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium shadow-sm transition hover:bg-slate-50"
                        href={`${editHrefPrefix}/${s.id}/edit`}
                      >
                        تعديل
                      </Link>
                      {s.isActive && <DeactivateForm serviceId={s.id} />}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
