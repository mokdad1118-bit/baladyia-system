import Link from "next/link";

export type CitizenNotificationRow = {
  id: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: Date;
  requestId: string | null;
  gasRequestId: string | null;
  returneeRegistrationId: string | null;
  type: string;
};

function isGasNotification(n: CitizenNotificationRow) {
  return n.gasRequestId != null || (n.type.startsWith("GAS_") && !n.returneeRegistrationId);
}

function isReturneeNotification(n: CitizenNotificationRow) {
  return n.returneeRegistrationId != null || n.type.startsWith("RETURNEE_");
}

function NotificationCard({
  n,
  requestsBasePath,
}: {
  n: CitizenNotificationRow;
  requestsBasePath: string;
}) {
  const gas = isGasNotification(n);
  const ret = isReturneeNotification(n);
  const href = gas
    ? `${requestsBasePath}#citizen-gas-requests`
    : ret
      ? `${requestsBasePath}#citizen-returnee-requests`
      : n.requestId
        ? `${requestsBasePath}/${n.requestId}`
        : undefined;

  const linkLabel = gas ? "عرض طلبات الغاز ←" : ret ? "عرض طلبات تسجيل العائدين ←" : "فتح الطلب ←";

  return (
    <li className={`gov-card p-4 ${n.read ? "" : "border-s-[3px] border-s-[var(--gov-primary)]"}`}>
      <div className="flex flex-wrap justify-between gap-2">
        <h2 className="font-semibold text-[var(--gov-text)]">{n.title}</h2>
        <time className="text-xs text-[var(--gov-muted)]" dateTime={n.createdAt.toISOString()}>
          {n.createdAt.toLocaleString("ar")}
        </time>
      </div>
      <p className="mt-1 text-sm text-[var(--gov-muted)]">{n.message}</p>
      {href ? (
        <Link
          className="mt-2 inline-flex min-h-10 items-center text-sm font-semibold text-[var(--gov-primary)] hover:underline"
          href={href}
        >
          {linkLabel}
        </Link>
      ) : null}
    </li>
  );
}

export function CitizenNotificationsView({
  list,
  requestsBasePath,
}: {
  list: CitizenNotificationRow[];
  requestsBasePath: string;
}) {
  const gasList = list.filter(isGasNotification);
  const returneeList = list.filter(isReturneeNotification);
  const municipalList = list.filter((n) => !isGasNotification(n) && !isReturneeNotification(n));

  const unreadMunicipal = municipalList.filter((n) => !n.read).length;
  const unreadGas = gasList.filter((n) => !n.read).length;
  const unreadReturnee = returneeList.filter((n) => !n.read).length;

  function sectionSummary(title: string, total: number, unread: number) {
    return (
      <summary className="gov-btn-primary cursor-pointer list-none px-4 py-2 text-sm font-semibold md:text-base">
        {title}
        <span className="me-2 mt-1 block text-xs font-normal opacity-90 md:inline md:mt-0">
          — الإجمالي: {total}
          {unread > 0 ? ` — غير مقروء: ${unread}` : ""}
        </span>
      </summary>
    );
  }

  if (list.length === 0) {
    return <div className="gov-card p-10 text-center text-sm text-[var(--gov-muted)]">لا إشعارات حالياً</div>;
  }

  return (
    <div className="space-y-4">
      <details open className="gov-card p-4">
        {sectionSummary("تنبيهات خدمات بلدية بصرى الشام", municipalList.length, unreadMunicipal)}
        <div className="mt-4">
          {municipalList.length === 0 ? (
            <p className="rounded-xl border border-dashed border-[var(--gov-border)] p-6 text-center text-sm text-[var(--gov-muted)]">
              لا تنبيهات للخدمات البلدية حالياً.
            </p>
          ) : (
            <ul className="space-y-3">{municipalList.map((n) => <NotificationCard key={n.id} n={n} requestsBasePath={requestsBasePath} />)}</ul>
          )}
        </div>
      </details>

      <details open className="gov-card p-4">
        {sectionSummary("تنبيهات خدمات الغاز", gasList.length, unreadGas)}
        <div className="mt-4">
          {gasList.length === 0 ? (
            <p className="rounded-xl border border-dashed border-[var(--gov-border)] p-6 text-center text-sm text-[var(--gov-muted)]">
              لا تنبيهات لخدمات الغاز حالياً.
            </p>
          ) : (
            <ul className="space-y-3">{gasList.map((n) => <NotificationCard key={n.id} n={n} requestsBasePath={requestsBasePath} />)}</ul>
          )}
        </div>
      </details>

      <details open className="gov-card p-4">
        {sectionSummary("تنبيهات تسجيل العائدين", returneeList.length, unreadReturnee)}
        <div className="mt-4">
          {returneeList.length === 0 ? (
            <p className="rounded-xl border border-dashed border-[var(--gov-border)] p-6 text-center text-sm text-[var(--gov-muted)]">
              لا تنبيهات لتسجيل العائدين حالياً.
            </p>
          ) : (
            <ul className="space-y-3">{returneeList.map((n) => <NotificationCard key={n.id} n={n} requestsBasePath={requestsBasePath} />)}</ul>
          )}
        </div>
      </details>
    </div>
  );
}
