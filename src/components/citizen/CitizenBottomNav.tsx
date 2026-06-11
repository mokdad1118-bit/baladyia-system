"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";
import { IconBellSm, IconGrid, IconHomeSm, IconInbox, IconMessageSm, IconNewsSm, IconUserSm } from "./citizen-icons";

function buildTabs(base: "" | "/citizen") {
  const home = base ? `${base}/` : "/";
  const services = `${base}/services`;
  const news = `${base}/news`;
  const requests = `${base}/requests`;
  const notificationsPath = `${base}/notifications`;
  const feedback = `${base}/feedback`;
  const account = `${base}/account`;
  return [
    {
      href: home,
      label: "الرئيسية",
      match: (p: string) => p === home || p === base || p === `${base}/`,
      Icon: IconHomeSm,
    },
    {
      href: services,
      label: "الخدمات",
      match: (p: string) => p === services || p.startsWith(`${services}/`),
      Icon: IconGrid,
    },
    {
      href: news,
      label: "أخبار المنطقة",
      match: (p: string) => p === news || p.startsWith(`${news}/`),
      Icon: IconNewsSm,
      badge: "news" as const,
    },
    {
      href: feedback,
      label: "شكاوى",
      match: (p: string) => p === feedback || p.startsWith(`${feedback}/`),
      Icon: IconMessageSm,
    },
    {
      href: requests,
      label: "طلباتي",
      match: (p: string) => p === requests || (p.startsWith(`${requests}/`) && !p.includes("/new/")),
      Icon: IconInbox,
    },
    {
      href: notificationsPath,
      label: "تنبيهات",
      match: (p: string) => p === notificationsPath || p.startsWith(`${notificationsPath}/`),
      Icon: IconBellSm,
    },
    {
      href: account,
      label: "حسابي",
      match: (p: string) => p === account || p.startsWith(`${account}/`),
      Icon: IconUserSm,
    },
  ] as const;
}

export function CitizenBottomNav({
  unreadNotifications = 0,
  unreadAreaNews = 0,
}: {
  unreadNotifications?: number;
  unreadAreaNews?: number;
}) {
  const path = usePathname() ?? "";
  const base: "" | "/citizen" = path.startsWith("/citizen") ? "/citizen" : "";
  const tabs = buildTabs(base);

  return (
    <nav
      className="fixed end-2 bottom-2 start-2 z-50 rounded-[1.5rem] border border-[var(--gov-border)]/80 bg-white/95 px-1.5 pt-1.5 shadow-[0_-8px_32px_-10px_rgba(18,74,56,0.14),0_4px_22px_-8px_rgba(18,74,56,0.16)] backdrop-blur-md md:hidden"
      style={{ paddingBottom: "max(0.375rem, env(safe-area-inset-bottom))" }}
      role="navigation"
      aria-label="تنقّل المواطن"
    >
      <ul className="mx-auto flex max-w-lg items-stretch gap-0.5 overflow-x-auto pb-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {tabs.map((tab) => {
          const { href, label, match, Icon } = tab;
          const badge = "badge" in tab ? tab.badge : undefined;
          const active = match(path);
          const showUnreadBadge =
            (badge === "news" && unreadAreaNews > 0) ||
            (!badge && unreadNotifications > 0 && (href.endsWith("/notifications") || href === "/notifications"));
          const unreadCount = badge === "news" ? unreadAreaNews : unreadNotifications;
          const badgeLabel = unreadCount > 99 ? "99+" : String(unreadCount);

          return (
            <li key={href} className="min-w-[3.55rem] flex-1">
              <Link
                href={href}
                className={cn(
                  "touch-manipulation flex min-h-[3.6rem] flex-col items-center justify-center text-center transition-colors duration-200 active:opacity-90",
                  active ? "text-[var(--gov-primary)]" : "text-[var(--gov-muted)]",
                )}
                aria-current={active ? "page" : undefined}
                aria-label={showUnreadBadge ? `${label}، ${unreadCount} غير مقروء` : undefined}
              >
                <span
                  className={cn(
                    "relative flex min-w-0 flex-col items-center justify-center gap-1 transition-[box-shadow,transform,background-color] duration-300 ease-out",
                    active ? "scale-[1.04]" : "hover:text-[var(--gov-primary)]",
                  )}
                >
                  <span
                    className={cn(
                      "relative flex h-9 w-9 items-center justify-center rounded-full transition duration-300",
                      active
                        ? "h-10 w-10 bg-[var(--gov-primary)] text-white shadow-[0_8px_24px_-10px_rgba(18,74,56,0.55)]"
                        : "bg-slate-100/80 text-slate-500",
                    )}
                  >
                    <Icon className="h-5 w-5 shrink-0" />
                  </span>
                  {showUnreadBadge ? (
                    <span
                      className="absolute end-0 top-0 flex h-[1.05rem] min-w-[1.05rem] items-center justify-center rounded-full bg-[var(--gov-primary)] px-1 text-[0.6rem] font-bold leading-none text-white ring-2 ring-white"
                      aria-hidden
                    >
                      {badgeLabel}
                    </span>
                  ) : null}
                  <span
                    className={cn(
                      "max-w-[3.55rem] truncate text-[0.58rem] font-bold leading-tight sm:text-[0.68rem]",
                      active ? "text-[var(--gov-primary)]" : "text-slate-500",
                    )}
                  >
                    {label}
                  </span>
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
