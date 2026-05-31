import { CitizenMobileShell } from "@/components/citizen/CitizenMobileShell";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { UserRole } from "@/generated/prisma/enums";
import Link from "next/link";
import { StateEmblem } from "@/components/gov/StateEmblem";
import { ENTITY_NAME_AR, PORTAL_SUBTITLE } from "@/lib/entity";
import { CitizenDesktopNavLinks } from "@/components/citizen/CitizenDesktopNavLinks";
import { municipalityCouncilName } from "@/lib/municipality-display";
import { countUnreadAreaNews } from "@/lib/area-news";

export default async function CitizenDashboardLayout({ children }: { children: React.ReactNode }) {
  const s = await auth();
  const isCitizen = s?.user?.role === UserRole.CITIZEN;
  const unreadNotifications =
    isCitizen && s.user?.id
      ? await db.notification.count({ where: { userId: s.user.id, read: false } })
      : 0;
  const unreadAreaNews =
    isCitizen && s.user?.id && s.user.municipalityId
      ? await countUnreadAreaNews(s.user.id, s.user.municipalityId)
      : 0;
  const municipality =
    isCitizen && s.user.municipalityId
      ? await db.municipality.findUnique({
          where: { id: s.user.municipalityId },
          select: { name: true },
        })
      : null;
  const citizenEntityName = municipalityCouncilName(municipality?.name) ?? ENTITY_NAME_AR;

  return (
    <div className="notranslate min-h-dvh min-w-0 overflow-x-hidden" translate="no">
      <div className="citizen-hide-global-chrome hidden border-b border-[var(--gov-border)] bg-white md:block">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3">
          <Link href="/" className="flex items-center gap-3 no-underline">
            <StateEmblem height={46} />
            <div className="text-start">
              <p className="text-[0.65rem] text-[var(--gov-muted)]">{PORTAL_SUBTITLE}</p>
              <p className="text-sm font-bold text-[var(--gov-text)]">{citizenEntityName}</p>
              <p className="text-xs text-[var(--gov-muted)]">تطبيق المواطن</p>
            </div>
          </Link>
          <CitizenDesktopNavLinks
            isCitizen={isCitizen}
            unreadNotifications={unreadNotifications}
            unreadAreaNews={unreadAreaNews}
          />
        </div>
        <div className="gov-divider-flag mx-auto max-w-6xl opacity-70" aria-hidden />
      </div>
      <div className="citizen-main-full mx-auto max-w-6xl px-0 md:px-4 md:py-6">
        <CitizenMobileShell
          isCitizen={isCitizen}
          unreadNotifications={unreadNotifications}
          unreadAreaNews={unreadAreaNews}
        >
          {children}
        </CitizenMobileShell>
      </div>
    </div>
  );
}
