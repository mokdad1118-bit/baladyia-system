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
    {
      href: feedback,
      label: "شكاوى",
      match: (p: string) => p === feedback || p.startsWith(`${feedback}/`),
      Icon: IconMessageSm,
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
      className="fixed end-3 bottom-3 start-3 z-50 rounded-[2rem] border border-[var(--gov-border)]/80 bg-white/95 px-2 pt-2 shadow-[0_-8px_32px_-10px_rgba(18,74,56,0.14),0_4px_22px_-8px_rgba(18,74,56,0.16)] backdrop-blur-md md:hidden"
      style={{ paddingBottom: "max(0.5rem, env(safe-area-inset-bottom))" }}
      role="navigation"
      aria-label="تنقّل المواطن"
    >
      <ul className="mx-auto flex max-w-lg items-stretch gap-1 overflow-x-auto pb-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
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
            <li key={href} className="min-w-[4.25rem] flex-1">
              <Link
                href={href}
                className={cn(
                  "touch-manipulation flex min-h-[4.25rem] flex-col items-center justify-center text-center transition-colors duration-200 active:opacity-90",
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
                      "relative flex h-12 w-12 items-center justify-center rounded-full transition duration-300",
                      active
                        ? "h-14 w-14 bg-[var(--gov-primary)] text-white shadow-[0_8px_24px_-10px_rgba(18,74,56,0.55)]"
                        : "bg-slate-100/80 text-slate-500",
                    )}
                  >
                    <Icon className={cn("h-6 w-6 shrink-0", active && "h-7 w-7")} />
                  </span>
                  {showUnreadBadge ? (
                    <span
                      className="absolute end-1 top-0 flex h-[1.25rem] min-w-[1.25rem] items-center justify-center rounded-full bg-[var(--gov-primary)] px-1 text-[0.65rem] font-bold leading-none text-white ring-2 ring-white"
                      aria-hidden
                    >
                      {badgeLabel}
                    </span>
                  ) : null}
                  <span
                    className={cn(
                      "max-w-[4.25rem] truncate text-[0.68rem] font-bold leading-tight sm:text-xs",
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
