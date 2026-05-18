import Link from "next/link";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { UserRole } from "@/generated/prisma/enums";
import { GovStepIndicator } from "@/components/gov/GovStepIndicator";
import { APP_NAME_AR } from "@/lib/entity";
import { citizenMunicipalityIdOrThrow } from "@/lib/municipality-scope";

export default async function BosraMunicipalServicesPage() {
  const s = await auth();
  let municipalityId: string | undefined;
  if (s?.user?.role === UserRole.CITIZEN) {
    try {
      municipalityId = citizenMunicipalityIdOrThrow(s);
    } catch {
      municipalityId = undefined;
    }
  }
  const services = await db.service.findMany({
    where: {
      isActive: true,
      ...(municipalityId ? { municipalityId } : {}),
    },
    orderBy: { name: "asc" },
  });
  const isCitizen = s?.user?.role === UserRole.CITIZEN;

  return (
    <div className="w-full min-w-0 max-w-full">
      <header className="gov-page-heading mb-3 border-b border-[var(--gov-border)] pb-3 md:mb-6 md:pb-4">
        <h1 className="text-base font-bold text-[var(--gov-text)] md:text-lg md:font-bold xl:text-xl">
          خدمات {APP_NAME_AR}
        </h1>
        <p className="mt-1 text-xs leading-relaxed text-[var(--gov-muted)] sm:text-sm">
          اختر خدمة ثم أكمل البيانات والمرفقات.
        </p>
      </header>
      <GovStepIndicator currentStep={1} density="compact" />
      {services.length === 0 ? (
        <div className="gov-card p-6 text-center text-sm text-[var(--gov-muted)] md:p-8">
          لا توجد خدمات مفعّلة حالياً.
        </div>
      ) : (
        <ul className="space-y-2 md:space-y-3">
          {services.map((v) => (
            <li key={v.id} className="min-w-0">
              {isCitizen ? (
                <Link
                  href={`/requests/new/${v.id}`}
                  aria-label={`تقديم طلب: ${v.name}`}
                  className="gov-card flex items-start gap-2.5 p-3 no-underline transition-colors hover:bg-[#f7faf8] active:bg-[#eef6f1] md:gap-4 md:p-5"
                >
                  <div className="min-w-0 flex-1">
                    <h2 className="break-words text-sm font-bold leading-snug text-[var(--gov-text)] md:text-base">
                      {v.name}
                    </h2>
                    {v.description ? (
                      <p className="mt-1 line-clamp-2 text-xs leading-snug text-[var(--gov-muted)] md:mt-1.5 md:line-clamp-none md:text-sm md:leading-relaxed">
                        {v.description}
                      </p>
                    ) : null}
                    <p className="mt-1.5 text-[0.7rem] text-[var(--gov-muted)] md:mt-2 md:text-xs">
                      الرسوم{" "}
                      <span className="font-mono font-semibold tabular-nums text-[var(--gov-text)]">{v.price}</span>{" "}
                      ل.س
                    </p>
                  </div>
                  <span className="gov-btn-primary mt-0.5 inline-flex min-h-9 min-w-[2.75rem] shrink-0 items-center justify-center self-start rounded-sm px-2 py-1.5 text-center text-[0.7rem] font-semibold leading-tight md:min-h-11 md:min-w-0 md:px-4 md:py-2.5 md:text-sm">
                    <span className="md:hidden">طلب</span>
                    <span className="hidden md:inline">تقديم طلب</span>
                  </span>
                </Link>
              ) : (
                <div className="gov-card flex flex-col gap-2 p-3 md:flex-row md:items-start md:justify-between md:gap-4 md:p-5">
                  <div className="min-w-0">
                    <h2 className="break-words text-sm font-bold leading-snug text-[var(--gov-text)] md:text-base">
                      {v.name}
                    </h2>
                    {v.description ? (
                      <p className="mt-1 line-clamp-2 text-xs leading-snug text-[var(--gov-muted)] md:mt-1.5 md:line-clamp-none md:text-sm md:leading-relaxed">
                        {v.description}
                      </p>
                    ) : (
                      <p className="mt-1 text-xs text-[var(--gov-muted)] md:text-sm">—</p>
                    )}
                    <p className="mt-1.5 text-[0.7rem] text-[var(--gov-muted)] md:mt-2 md:text-xs">
                      الرسوم{" "}
                      <span className="font-mono font-semibold tabular-nums text-[var(--gov-text)]">{v.price}</span>{" "}
                      ل.س
                    </p>
                  </div>
                  <p className="shrink-0 text-xs text-[var(--gov-muted)] md:text-sm">
                    <Link
                      href="/citizen/welcome?next=/services/bosra"
                      className="font-semibold text-[var(--gov-primary)] hover:underline"
                    >
                      سجّل الدخول كمواطن
                    </Link>{" "}
                    لإرسال الطلب
                  </p>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
