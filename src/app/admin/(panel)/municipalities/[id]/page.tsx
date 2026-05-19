import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { requireSuperAdminPanel } from "@/lib/admin-guard";
import { requestStatusAr, userRoleAr } from "@/lib/labels";
import { UserRole } from "@/generated/prisma/enums";
import { municipalityCouncilName } from "@/lib/municipality-display";

type PageProps = { params: Promise<{ id: string }> };

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="gov-card p-4">
      <p className="text-xs text-[var(--gov-muted)]">{label}</p>
      <p className="mt-1 text-2xl font-bold text-[var(--gov-text)]">{value}</p>
    </div>
  );
}

export default async function MunicipalityDetailsPage({ params }: PageProps) {
  const s = await auth();
  await requireSuperAdminPanel(s);
  const { id } = await params;

  const municipality = await db.municipality.findUnique({
    where: { id },
    include: {
      _count: {
        select: {
          users: true,
          departments: true,
          services: true,
          requests: true,
          citizenFeedbacks: true,
          gasRequests: true,
          returneeRegistrations: true,
          socialServiceCases: true,
          pendingCitizenRegistrations: true,
        },
      },
    },
  });

  if (!municipality) notFound();

  const [citizens, staff, services, requests, gasRequests, feedbacks, socialCases, returnees] =
    await Promise.all([
      db.user.findMany({
        where: { municipalityId: id, role: UserRole.CITIZEN },
        orderBy: { createdAt: "desc" },
        take: 20,
        select: { id: true, name: true, phone: true, email: true, isVerified: true, createdAt: true },
      }),
      db.user.findMany({
        where: {
          municipalityId: id,
          role: { in: [UserRole.MUNICIPALITY_ADMIN, UserRole.EMPLOYEE, UserRole.GAS_AGENT] },
        },
        orderBy: [{ role: "asc" }, { createdAt: "desc" }],
        take: 30,
        select: { id: true, name: true, email: true, phone: true, role: true, isActive: true },
      }),
      db.service.findMany({
        where: { municipalityId: id },
        orderBy: [{ isActive: "desc" }, { name: "asc" }],
        take: 30,
        select: { id: true, name: true, price: true, isActive: true },
      }),
      db.request.findMany({
        where: { municipalityId: id },
        orderBy: { createdAt: "desc" },
        take: 20,
        include: {
          service: { select: { name: true } },
          citizen: { select: { name: true, phone: true } },
        },
      }),
      db.gasRequest.findMany({
        where: { municipalityId: id },
        orderBy: { createdAt: "desc" },
        take: 20,
        select: {
          id: true,
          gasRequestNumber: true,
          fullName: true,
          phone: true,
          area: true,
          isCompleted: true,
          createdAt: true,
        },
      }),
      db.citizenFeedback.findMany({
        where: { municipalityId: id },
        orderBy: { createdAt: "desc" },
        take: 20,
        include: { citizen: { select: { name: true, phone: true } } },
      }),
      db.socialServiceCase.findMany({
        where: { municipalityId: id },
        orderBy: { createdAt: "desc" },
        take: 20,
        select: { id: true, caseNumber: true, category: true, fullName: true, phone: true, status: true, createdAt: true },
      }),
      db.returneeRegistration.findMany({
        where: { municipalityId: id },
        orderBy: { createdAt: "desc" },
        take: 20,
        select: { id: true, registrationNumber: true, fullName: true, phone: true, status: true, createdAt: true },
      }),
    ]);

  const councilName = municipalityCouncilName(municipality.name) ?? municipality.name;

  return (
    <div className="space-y-6">
      <header className="gov-page-heading border-b border-[var(--gov-border)] pb-4">
        <Link href="/admin/municipalities" className="text-sm text-[var(--gov-primary)] hover:underline">
          ← العودة إلى البلديات
        </Link>
        <h1 className="mt-2 text-lg font-bold text-[var(--gov-text)] md:text-xl">{councilName}</h1>
        <p className="mt-1 text-sm text-[var(--gov-muted)]">
          المعرّف: <span dir="ltr">{municipality.code}</span> — المحافظة: {municipality.governorate} —{" "}
          الحالة: {municipality.isActive ? "مفعّلة" : "معطّلة"}
        </p>
      </header>

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="المستخدمون" value={municipality._count.users} />
        <StatCard label="الخدمات" value={municipality._count.services} />
        <StatCard label="طلبات الخدمات" value={municipality._count.requests} />
        <StatCard label="شكاوى ومقترحات" value={municipality._count.citizenFeedbacks} />
        <StatCard label="طلبات الغاز" value={municipality._count.gasRequests} />
        <StatCard label="الخدمات الاجتماعية" value={municipality._count.socialServiceCases} />
        <StatCard label="تسجيل العائدين" value={municipality._count.returneeRegistrations} />
        <StatCard label="تسجيلات معلّقة" value={municipality._count.pendingCitizenRegistrations} />
      </section>

      <section className="gov-card p-4">
        <h2 className="mb-3 text-base font-bold">آخر طلبات الخدمات</h2>
        {requests.length === 0 ? (
          <p className="text-sm text-[var(--gov-muted)]">لا توجد طلبات.</p>
        ) : (
          <div className="gov-table-wrap overflow-x-auto">
            <table className="gov-table min-w-[48rem]">
              <thead>
                <tr>
                  <th>الرقم</th>
                  <th>الخدمة</th>
                  <th>المواطن</th>
                  <th>الحالة</th>
                  <th>التاريخ</th>
                </tr>
              </thead>
              <tbody>
                {requests.map((r) => (
                  <tr key={r.id}>
                    <td>
                      <Link className="text-[var(--gov-primary)] hover:underline" href={`/admin/requests/${r.id}`}>
                        {r.requestNumber}
                      </Link>
                    </td>
                    <td>{r.service.name}</td>
                    <td>{r.citizen.name}</td>
                    <td>{requestStatusAr[r.status]}</td>
                    <td>{r.createdAt.toLocaleDateString("ar")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <SummaryList title="المواطنون" empty="لا يوجد مواطنون مسجلون.">
          {citizens.map((u) => (
            <li key={u.id} className="border-b border-[var(--gov-border)] py-2 last:border-0">
              <p className="font-semibold">{u.name}</p>
              <p className="text-xs text-[var(--gov-muted)]" dir="ltr">
                {u.phone ?? u.email ?? "—"}
              </p>
            </li>
          ))}
        </SummaryList>

        <SummaryList title="الموظفون والمعتمدون" empty="لا يوجد موظفون مرتبطون بهذه البلدية.">
          {staff.map((u) => (
            <li key={u.id} className="border-b border-[var(--gov-border)] py-2 last:border-0">
              <p className="font-semibold">{u.name}</p>
              <p className="text-xs text-[var(--gov-muted)]">
                {userRoleAr[u.role]} — {u.isActive ? "مفعّل" : "معطّل"}
              </p>
            </li>
          ))}
        </SummaryList>

        <SummaryList title="الخدمات" empty="لا توجد خدمات.">
          {services.map((svc) => (
            <li key={svc.id} className="border-b border-[var(--gov-border)] py-2 last:border-0">
              <p className="font-semibold">{svc.name}</p>
              <p className="text-xs text-[var(--gov-muted)]">
                {svc.isActive ? "مفعّلة" : "معطّلة"} — {svc.price} ل.س
              </p>
            </li>
          ))}
        </SummaryList>

        <SummaryList title="طلبات الغاز" empty="لا توجد طلبات غاز.">
          {gasRequests.map((r) => (
            <li key={r.id} className="border-b border-[var(--gov-border)] py-2 last:border-0">
              <p className="font-semibold">{r.gasRequestNumber} — {r.fullName}</p>
              <p className="text-xs text-[var(--gov-muted)]">{r.area} — {r.isCompleted ? "مكتمل" : "قيد المتابعة"}</p>
            </li>
          ))}
        </SummaryList>

        <SummaryList title="الخدمات الاجتماعية" empty="لا توجد طلبات اجتماعية.">
          {socialCases.map((r) => (
            <li key={r.id} className="border-b border-[var(--gov-border)] py-2 last:border-0">
              <p className="font-semibold">{r.caseNumber} — {r.fullName ?? "—"}</p>
              <p className="text-xs text-[var(--gov-muted)]">{r.category} — {r.status}</p>
            </li>
          ))}
        </SummaryList>

        <SummaryList title="تسجيل العائدين" empty="لا توجد تسجيلات عائدين.">
          {returnees.map((r) => (
            <li key={r.id} className="border-b border-[var(--gov-border)] py-2 last:border-0">
              <p className="font-semibold">{r.registrationNumber} — {r.fullName}</p>
              <p className="text-xs text-[var(--gov-muted)]">{r.status}</p>
            </li>
          ))}
        </SummaryList>
      </section>

      <SummaryList title="آخر الشكاوى والمقترحات" empty="لا توجد شكاوى أو مقترحات.">
        {feedbacks.map((f) => (
          <li key={f.id} className="border-b border-[var(--gov-border)] py-3 last:border-0">
            <p className="font-semibold">{f.citizen.name}</p>
            <p className="mt-1 text-sm text-[var(--gov-muted)]">{f.message}</p>
          </li>
        ))}
      </SummaryList>
    </div>
  );
}

function SummaryList({
  title,
  empty,
  children,
}: {
  title: string;
  empty: string;
  children: React.ReactNode;
}) {
  const hasChildren = Array.isArray(children) ? children.length > 0 : Boolean(children);
  return (
    <section className="gov-card p-4">
      <h2 className="mb-3 text-base font-bold">{title}</h2>
      {hasChildren ? <ul>{children}</ul> : <p className="text-sm text-[var(--gov-muted)]">{empty}</p>}
    </section>
  );
}
