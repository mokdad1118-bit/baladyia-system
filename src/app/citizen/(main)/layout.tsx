import { CitizenMobileShell } from "@/components/citizen/CitizenMobileShell";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { UserRole } from "@/generated/prisma/enums";
import Link from "next/link";
import { StateEmblem } from "@/components/gov/StateEmblem";
import { ENTITY_NAME_AR, PORTAL_SUBTITLE } from "@/lib/entity";
import { CitizenDesktopNavLinks } from "@/components/citizen/CitizenDesktopNavLinks";

export default async function CitizenMainChromeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const s = await auth();
  const isCitizen = s?.user?.role === UserRole.CITIZEN;
  const unreadNotifications =
    isCitizen && s.user?.id
      ? await db.notification.count({ where: { userId: s.user.id, read: false } })
      : 0;

  return (
    <div className="min-h-dvh">
      <div className="citizen-hide-global-chrome hidden border-b border-[var(--gov-border)] bg-white md:block">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3">
          <Link href="/citizen" className="flex items-center gap-3 no-underline">
            <StateEmblem height={46} />
            <div className="text-start">
              <p className="text-[0.65rem] text-[var(--gov-muted)]">{PORTAL_SUBTITLE}</p>
              <p className="text-sm font-bold text-[var(--gov-text)]">{ENTITY_NAME_AR}</p>
            </div>
          </Link>
          <CitizenDesktopNavLinks isCitizen={isCitizen} unreadNotifications={unreadNotifications} />
        </div>
        <div className="gov-divider-flag mx-auto max-w-6xl opacity-70" aria-hidden />
      </div>
      <div className="citizen-main-full mx-auto max-w-6xl px-0 md:px-4 md:py-6">
        <CitizenMobileShell isCitizen={isCitizen} unreadNotifications={unreadNotifications}>
          {children}
        </CitizenMobileShell>
      </div>
    </div>
  );
}
