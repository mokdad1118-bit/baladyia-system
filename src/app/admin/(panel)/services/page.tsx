import Link from "next/link";
import { db } from "@/lib/db";
import { DeactivateForm } from "./DeactivateForm";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/cn";
import { auth } from "@/auth";
import { requireAdminRole } from "@/lib/admin-guard";

export default async function AdminServicesPage() {
  await requireAdminRole(await auth());
  const list = await db.service.findMany({ orderBy: { createdAt: "desc" } });
  return (
    <div>
      <PageHeader
        title="الخدمات"
        actions={
          <Link
            className="inline-flex h-10 items-center justify-center rounded-xl bg-emerald-700 px-4 text-sm font-semibold text-white shadow-sm hover:bg-emerald-800"
            href="/admin/services/new"
          >
            + خدمة جديدة
          </Link>
        }
      />
      <ul className="space-y-2">
        {list.map((s) => (
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
                      href={`/admin/services/${s.id}/edit`}
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
    </div>
  );
}
