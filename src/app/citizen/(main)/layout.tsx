import { CitizenMobileShell } from "@/components/citizen/CitizenMobileShell";
import { auth } from "@/auth";
import { UserRole } from "@/generated/prisma/enums";
import Link from "next/link";
import { StateEmblem } from "@/components/gov/StateEmblem";
import { ENTITY_NAME_AR, PORTAL_SUBTITLE } from "@/lib/entity";

export default async function CitizenMainChromeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const s = await auth();
  const isCitizen = s?.user?.role === UserRole.CITIZEN;

  return (
    <div className="min-h-dvh">
      <div className="citizen-hide-global-chrome hidden border-b border-[var(--gov-border)] bg-white md:block">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3">
          <Link href="/citizen" className="flex items-center gap-3 no-underline">
            <StateEmblem height={40} />
            <div className="text-start">
              <p className="text-[0.65rem] text-[var(--gov-muted)]">{PORTAL_SUBTITLE}</p>
              <p className="text-sm font-bold text-[var(--gov-text)]">{ENTITY_NAME_AR}</p>
              <p className="text-xs text-[var(--gov-muted)]">بوابة المواطن</p>
            </div>
          </Link>
          <nav className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
            <Link className="text-[var(--gov-primary)] hover:underline" href="/citizen/services">
              الخدمات
            </Link>
            {isCitizen ? (
              <>
                <Link className="text-[var(--gov-primary)] hover:underline" href="/citizen/requests">
                  طلباتي
                </Link>
                <Link className="text-[var(--gov-primary)] hover:underline" href="/citizen/notifications">
                  الإشعارات
                </Link>
                <Link className="text-[var(--gov-primary)] hover:underline" href="/citizen">
                  الرئيسية
                </Link>
              </>
            ) : (
              <>
                <Link className="text-[var(--gov-primary)] hover:underline" href="/citizen/login">
                  تسجيل الدخول
                </Link>
                <Link className="text-[var(--gov-primary)] hover:underline" href="/citizen/register">
                  تسجيل
                </Link>
              </>
            )}
          </nav>
        </div>
        <div className="gov-divider-flag mx-auto max-w-6xl opacity-70" aria-hidden />
      </div>
      <div className="citizen-main-full mx-auto max-w-6xl px-0 md:px-4 md:py-6">
        <CitizenMobileShell isCitizen={isCitizen}>{children}</CitizenMobileShell>
      </div>
    </div>
  );
}
