import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { UserRole } from "@/generated/prisma/enums";
import { RequestForm } from "@/components/RequestForm";
import Link from "next/link";

type Props = { params: Promise<{ serviceId: string }> };

export default async function CitizenNewRequestPage({ params }: Props) {
  const { serviceId } = await params;
  const s = await auth();
  if (!s?.user) {
    redirect(`/citizen/login?next=${encodeURIComponent(`/citizen/requests/new/${serviceId}`)}`);
  }
  if (s.user.role !== UserRole.CITIZEN) {
    redirect(
      s.user.role === UserRole.EMPLOYEE ? "/employee" : s.user.role === UserRole.ADMIN ? "/admin" : "/",
    );
  }
  const prefill = await db.user.findUnique({
    where: { id: s.user.id },
    select: { name: true, phone: true, email: true, notificationEmail: true },
  });
  const service = await db.service.findFirst({
    where: { id: serviceId, isActive: true },
    include: { documents: true },
  });
  if (!service) notFound();
  if (service.documents.length === 0) {
    return (
      <div className="gov-panel mx-auto max-w-lg px-3 text-center md:px-0">
        <h1 className="text-lg font-bold text-[var(--gov-text)]">{service.name}</h1>
        <p className="mt-2 text-sm text-[var(--gov-muted)]">لا توجد مستندات مُعرَّفة لهذه الخدمة.</p>
        <Link className="mt-4 inline-block text-sm text-[var(--gov-primary)] hover:underline" href="/citizen/services">
          العودة للخدمات
        </Link>
      </div>
    );
  }
  return (
    <div className="gov-panel px-3 md:px-0">
      <header className="gov-page-heading mb-6 border-b border-[var(--gov-border)] pb-4">
        <h1 className="text-lg font-bold text-[var(--gov-text)] md:text-xl">تقديم طلب</h1>
        <p className="mt-1 text-sm text-[var(--gov-muted)]">{service.name}</p>
        <p className="mt-2 text-xs text-[var(--gov-muted)]">
          الرسوم: <span className="font-mono font-semibold text-[var(--gov-text)]">{service.price}</span> ل.س
        </p>
      </header>
      <div className="gov-card p-4 md:p-6">
        <RequestForm service={service} prefill={prefill} />
      </div>
    </div>
  );
}
