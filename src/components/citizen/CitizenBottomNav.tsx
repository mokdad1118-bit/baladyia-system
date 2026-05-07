"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";
import { IconGrid, IconInbox, IconBellSm, IconUserSm } from "./citizen-icons";

function buildTabs(base: "" | "/citizen") {
  const services = `${base}/services`;
  const requests = `${base}/requests`;
  const notificationsPath = `${base}/notifications`;
  const account = `${base}/account`;
  return [
    {
      href: services,
      label: "الخدمات",
      match: (p: string) => p === services || p.startsWith(`${services}/`),
      Icon: IconGrid,
    },
    {
      href: requests,
      label: "طلباتي",
      match: (p: string) =>
        p === requests ||
        (p.startsWith(`${requests}/`) && !p.includes("/new/")),
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

export function CitizenBottomNav({ unreadNotifications = 0 }: { unreadNotifications?: number }) {
  const path = usePathname() ?? "";
  const base: "" | "/citizen" = path.startsWith("/citizen") ? "/citizen" : "";
  const tabs = buildTabs(base);

  return (
    <nav
      className="fixed end-0 bottom-0 start-0 z-50 border-t border-[var(--gov-border)]/80 bg-white/95 shadow-[0_-8px_32px_-10px_rgba(18,74,56,0.1),0_-2px_12px_-4px_rgba(18,74,56,0.06)] backdrop-blur-md md:hidden"
      style={{ paddingBottom: "max(0.5rem, env(safe-area-inset-bottom))" }}
      role="navigation"
      aria-label="تنقّل المواطن"
    >
      <ul className="mx-auto flex max-w-lg items-stretch justify-around">
        {tabs.map(({ href, label, match, Icon }) => {
          const active = match(path);
          const showUnreadBadge =
            unreadNotifications > 0 && (href.endsWith("/notifications") || href === "/notifications");
          const badge =
            unreadNotifications > 99 ? "99+" : String(unreadNotifications);
          return (
            <li key={href} className="min-w-0 flex-1">
              <Link
                href={href}
                className={cn(
                  "touch-manipulation flex min-h-[3.5rem] flex-col items-center justify-center py-1.5 text-center transition-colors duration-200 active:opacity-90",
                  active ? "text-[var(--gov-primary)]" : "text-[var(--gov-muted)]",
                )}
                aria-current={active ? "page" : undefined}
                aria-label={
                  showUnreadBadge ? `${label}، ${unreadNotifications} غير مقروء` : undefined
                }
              >
                <span
                  className={cn(
                    "relative flex flex-col items-center justify-center gap-0.5 rounded-full px-2.5 py-1 transition-[box-shadow,transform,background-color] duration-300 ease-out",
                    active
                      ? "scale-[1.02] bg-gradient-to-b from-white to-emerald-50/60 shadow-[0_2px_8px_-1px_rgba(18,74,56,0.1),0_6px_20px_-6px_rgba(18,74,56,0.14),inset_0_1px_0_rgba(255,255,255,0.95)] ring-1 ring-[var(--gov-primary)]/45 ring-offset-[3px] ring-offset-white"
                      : "hover:bg-emerald-50/30",
                  )}
                >
                  <Icon className={cn("h-6 w-6 shrink-0", active && "text-[var(--gov-primary)]")} />
                  {showUnreadBadge ? (
                    <span
                      className="absolute end-1 top-0 flex h-[1.125rem] min-w-[1.125rem] items-center justify-center rounded-full bg-[var(--gov-primary)] px-1 text-[0.65rem] font-bold leading-none text-white"
                      aria-hidden
                    >
                      {badge}
                    </span>
                  ) : null}
                  <span className="text-[0.7rem] font-medium leading-tight sm:text-xs">{label}</span>
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
