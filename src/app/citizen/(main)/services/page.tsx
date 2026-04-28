import Link from "next/link";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { UserRole } from "@/generated/prisma/enums";
import { GovStepIndicator } from "@/components/gov/GovStepIndicator";

export default async function CitizenServicesPage() {
  const s = await auth();
  const services = await db.service.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
  });
  const isCitizen = s?.user?.role === UserRole.CITIZEN;

  return (
    <div className="w-full px-3 md:px-0">
      <header className="gov-page-heading mb-6 border-b border-[var(--gov-border)] pb-4">
        <h1 className="text-lg font-bold text-[var(--gov-text)] md:text-xl">الخدمات المتاحة</h1>
        <p className="mt-1 text-sm text-[var(--gov-muted)]">اختر الخدمة، ثم أكمل النموذج والمرفقات من بوابة الطلب.</p>
      </header>
      <GovStepIndicator currentStep={1} />
      {services.length === 0 ? (
        <div className="gov-card p-8 text-center text-sm text-[var(--gov-muted)]">لا توجد خدمات مفعّلة حالياً.</div>
      ) : (
        <ul className="space-y-3">
          {services.map((v) => (
            <li key={v.id} className="gov-card p-4 md:p-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <h2 className="text-base font-bold text-[var(--gov-text)]">{v.name}</h2>
                  <p className="mt-1 text-sm leading-relaxed text-[var(--gov-muted)]">{v.description || "—"}</p>
                  <p className="mt-2 text-xs text-[var(--gov-muted)]">
                    الرسوم: <span className="font-mono font-semibold text-[var(--gov-text)]">{v.price}</span> ل.س
                  </p>
                </div>
                <div className="shrink-0">
                  {isCitizen ? (
                    <Link
                      href={`/citizen/requests/new/${v.id}`}
                      className="gov-btn-primary inline-flex min-h-11 w-full items-center justify-center px-4 py-2.5 text-sm font-semibold no-underline sm:w-auto"
                    >
                      تقديم طلب
                    </Link>
                  ) : (
                    <p className="text-sm text-[var(--gov-muted)]">
                      <Link
                        href="/citizen/login?next=/citizen/services"
                        className="font-semibold text-[var(--gov-primary)] hover:underline"
                      >
                        سجّل الدخول كمواطن
                      </Link>{" "}
                      لإرسال الطلب
                    </p>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
