import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { requestStatusAr } from "@/lib/labels";
import { StatusBadge } from "@/components/ui/status-badge";

type P = { params: Promise<{ id: string }> };

export default async function CitizenRequestDetailPage({ params }: P) {
  const s = await auth();
  if (!s?.user) redirect("/citizen/login");
  const { id } = await params;
  const r = await db.request.findFirst({
    where: { id, citizenId: s.user.id },
    include: {
      service: true,
      statusLogs: { orderBy: { createdAt: "asc" }, include: { actor: true } },
      files: { include: { serviceDocument: true } },
    },
  });
  if (!r) notFound();

  return (
    <div className="px-3 md:px-0">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-2 border-b border-[var(--gov-border)] pb-4">
        <div>
          <h1 className="font-mono text-lg font-bold text-[var(--gov-text)]">{r.requestNumber}</h1>
          <p className="text-sm text-[var(--gov-muted)]">{r.service.name}</p>
        </div>
        <StatusBadge status={r.status} />
      </div>
      <div className="space-y-4">
        <div className="gov-card p-4">
          <h2 className="mb-3 border-b border-[var(--gov-border)] pb-2 text-sm font-bold">سجل الحالات</h2>
          <ul className="space-y-3 text-sm">
            {r.statusLogs.map((l) => (
              <li key={l.id} className="border-b border-[var(--gov-border)]/60 pb-2 last:border-0">
                <p className="text-xs text-[var(--gov-muted)]">{l.createdAt.toLocaleString("ar")}</p>
                <p className="font-medium text-[var(--gov-text)]">{requestStatusAr[l.toStatus]}</p>
                {l.noteForCitizen ? <p className="text-[var(--gov-muted)]">{l.noteForCitizen}</p> : null}
              </li>
            ))}
          </ul>
        </div>
        <div className="gov-card p-4">
          <h2 className="mb-3 text-sm font-bold">المرفقات</h2>
          <ul className="space-y-2 text-sm">
            {r.files.map((f) => (
              <li key={f.id} className="flex flex-wrap justify-between gap-2">
                <span className="text-[var(--gov-muted)]">{f.serviceDocument.name}</span>
                <a
                  className="font-medium text-[var(--gov-primary)] hover:underline"
                  href={`/api/request-files/${f.id}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  {f.originalName}
                </a>
              </li>
            ))}
          </ul>
        </div>
        <Link href="/citizen/requests" className="inline-block text-sm text-[var(--gov-primary)] hover:underline">
          ← العودة لقائمة الطلبات
        </Link>
      </div>
    </div>
  );
}
