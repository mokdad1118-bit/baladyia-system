import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { CitizenRequestsView } from "@/components/citizen/CitizenRequestsView";

type S = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export default async function CitizenRequestsPage({ searchParams }: S) {
  const s = await auth();
  if (!s?.user) redirect("/citizen/welcome?next=/requests");
  const sp = await searchParams;
  const success = sp.success === "1";
  const no = typeof sp.no === "string" ? sp.no : null;

  const municipalityRequests = await db.request.findMany({
    where: {
      citizenId: s.user.id,
    },
    orderBy: { createdAt: "desc" },
    include: { service: true },
  });
  const gasRequests = await db.gasRequest.findMany({
    where: { citizenId: s.user.id },
    orderBy: { createdAt: "desc" },
  });
  const returneeRegistrations = await db.returneeRegistration.findMany({
    where: { citizenId: s.user.id },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="w-full min-w-0 max-w-full">
      <div className="mb-6 flex flex-col gap-3 border-b border-[var(--gov-border)] pb-4 sm:flex-row sm:items-end sm:justify-between">
        <header className="gov-page-heading">
          <h1 className="text-lg font-bold text-[var(--gov-text)] md:text-xl">طلباتي</h1>
          <p className="mt-1 text-sm text-[var(--gov-muted)]">متابعة الحالة والمرجع لكل طلب.</p>
        </header>
        <Link
          href="/services"
          className="gov-btn-secondary inline-flex min-h-11 w-full shrink-0 items-center justify-center px-4 text-sm font-semibold no-underline sm:w-auto"
        >
          + طلب جديد
        </Link>
      </div>

      {success && (
        <div
          role="status"
          className="mb-4 border border-[var(--gov-flag-green)]/40 bg-[var(--gov-flag-green)]/5 px-4 py-3 text-sm text-[var(--gov-text)]"
        >
          <p className="font-semibold text-[var(--gov-text)]">قد تم إرسال طلبك بنجاح.</p>
          {no ? (
            <p className="mt-2">
              الرقم المرجعي: <strong className="font-mono">{no}</strong>
            </p>
          ) : null}
          <p className="mt-2 leading-relaxed">
            تابع تفاصيل طلبك من تبويب <span className="font-semibold">طلباتي</span> داخل التطبيق.
          </p>
        </div>
      )}

      <CitizenRequestsView
        requestsBasePath="/requests"
        municipalityRequests={municipalityRequests.map((r) => ({
          id: r.id,
          requestNumber: r.requestNumber,
          serviceName: r.service.name,
          status: r.status,
          createdAt: r.createdAt.toISOString(),
        }))}
        gasRequests={gasRequests.map((g) => ({
          id: g.id,
          gasRequestNumber: g.gasRequestNumber,
          fullName: g.fullName,
          phone: g.phone,
          nationalId: g.nationalId,
          isCompleted: g.isCompleted,
          createdAt: g.createdAt.toISOString(),
        }))}
        returneeRegistrations={returneeRegistrations.map((r) => ({
          id: r.id,
          registrationNumber: r.registrationNumber,
          fullName: r.fullName,
          birthDate: r.birthDate.toISOString(),
          nationalId: r.nationalId,
          phone: r.phone,
          email: r.email,
          status: r.status,
          createdAt: r.createdAt.toISOString(),
        }))}
      />
    </div>
  );
}
