"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { APP_NAME_AR } from "@/lib/entity";

export type CitizenNotificationRow = {
  id: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: Date;
  requestId: string | null;
  gasRequestId: string | null;
  returneeRegistrationId: string | null;
  socialServiceCaseId: string | null;
  citizenFeedbackId: string | null;
  type: string;
};

function isReturneeNotification(n: CitizenNotificationRow) {
  return n.returneeRegistrationId != null || n.type.startsWith("RETURNEE_");
}

function isGasNotification(n: CitizenNotificationRow) {
  return n.gasRequestId != null || (n.type.startsWith("GAS_") && !n.returneeRegistrationId);
}

function isFeedbackNotification(n: CitizenNotificationRow) {
  return n.citizenFeedbackId != null || n.type.startsWith("FEEDBACK_");
}

function isSocialNotification(n: CitizenNotificationRow) {
  return n.socialServiceCaseId != null || n.type.startsWith("SOCIAL_SERVICE_");
}

/** تقسيم بدون ازدواجية: العائدين ثم الغاز ثم الشكاوي ثم البلدية */
function partitionNotifications(list: CitizenNotificationRow[]) {
  const returneeList = list.filter(isReturneeNotification);
  const gasList = list.filter((n) => !isReturneeNotification(n) && isGasNotification(n));
  const socialList = list.filter(
    (n) => !isReturneeNotification(n) && !isGasNotification(n) && isSocialNotification(n),
  );
  const feedbackList = list.filter(
    (n) => !isReturneeNotification(n) && !isGasNotification(n) && !isSocialNotification(n) && isFeedbackNotification(n),
  );
  const municipalList = list.filter(
    (n) => !isReturneeNotification(n) && !isGasNotification(n) && !isSocialNotification(n) && !isFeedbackNotification(n),
  );
  return { returneeList, gasList, socialList, feedbackList, municipalList };
}

function NotificationCard({
  n,
  requestsBasePath,
  feedbackBasePath,
}: {
  n: CitizenNotificationRow;
  requestsBasePath: string;
  feedbackBasePath: string;
}) {
  const gas = !isReturneeNotification(n) && isGasNotification(n);
  const ret = isReturneeNotification(n);
  const feedback =
    !isReturneeNotification(n) && !isGasNotification(n) && isFeedbackNotification(n) && n.citizenFeedbackId;
  const href = feedback
    ? `${feedbackBasePath}#citizen-feedback-${n.citizenFeedbackId}`
    : gas
      ? `${requestsBasePath}#citizen-gas-requests`
      : ret
        ? `${requestsBasePath}#citizen-returnee-requests`
        : isSocialNotification(n)
          ? `${requestsBasePath}#citizen-social-requests`
        : n.requestId
          ? `${requestsBasePath}/${n.requestId}`
          : undefined;

  const linkLabel = feedback
    ? "عرض الشكوى والرد ←"
    : gas
      ? "عرض طلبات الغاز ←"
      : ret
        ? "عرض طلبات تسجيل العائدين ←"
        : isSocialNotification(n)
          ? "عرض طلبات الخدمات الاجتماعية ←"
        : "فتح الطلب ←";

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

function NotificationsDialog({
  title,
  open,
  onClose,
  list,
  requestsBasePath,
  feedbackBasePath,
}: {
  title: string;
  open: boolean;
  onClose: () => void;
  list: CitizenNotificationRow[];
  requestsBasePath: string;
  feedbackBasePath: string;
}) {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/40 p-2 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-label={title}
      onClick={onClose}
    >
      <div
        className="gov-card my-auto w-full max-w-3xl overflow-hidden rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-[var(--gov-border)] px-4 py-3">
          <h2 className="text-base font-bold text-[var(--gov-text)] md:text-lg">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex min-h-10 items-center rounded-lg border border-[var(--gov-border)] px-3 text-sm font-semibold text-[var(--gov-text)] hover:bg-[#f3f5f7]"
          >
            إغلاق
          </button>
        </div>
        <div className="max-h-[min(78dvh,calc(100vh-120px))] overflow-auto p-4">
          {list.length === 0 ? (
            <p className="rounded-xl border border-dashed border-[var(--gov-border)] p-6 text-center text-sm text-[var(--gov-muted)]">
              لا توجد تنبيهات في هذا القسم حالياً.
            </p>
          ) : (
            <ul className="space-y-3">
              {list.map((n) => (
                <NotificationCard
                  key={n.id}
                  n={n}
                  requestsBasePath={requestsBasePath}
                  feedbackBasePath={feedbackBasePath}
                />
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

export function CitizenNotificationsView({
  list,
  requestsBasePath,
  feedbackBasePath,
}: {
  list: CitizenNotificationRow[];
  requestsBasePath: string;
  feedbackBasePath: string;
}) {
  const { municipalList, gasList, returneeList, socialList, feedbackList } = partitionNotifications(list);
  const [openSection, setOpenSection] = useState<"gas" | "returnee" | "social" | "municipal" | "feedback" | null>(null);

  const unreadMunicipal = municipalList.filter((n) => !n.read).length;
  const unreadGas = gasList.filter((n) => !n.read).length;
  const unreadReturnee = returneeList.filter((n) => !n.read).length;
  const unreadSocial = socialList.filter((n) => !n.read).length;
  const unreadFeedback = feedbackList.filter((n) => !n.read).length;
  const totalUnread = unreadMunicipal + unreadGas + unreadReturnee + unreadSocial + unreadFeedback;
  const currentList = useMemo(() => {
    if (openSection === "gas") return gasList;
    if (openSection === "returnee") return returneeList;
    if (openSection === "social") return socialList;
    if (openSection === "feedback") return feedbackList;
    if (openSection === "municipal") return municipalList;
    return [];
  }, [gasList, returneeList, socialList, feedbackList, municipalList, openSection]);
  const currentTitle =
    openSection === "gas"
      ? "تنبيهات خدمات الغاز"
      : openSection === "returnee"
        ? "تنبيهات تسجيل العائدين"
        : openSection === "social"
          ? "تنبيهات الخدمات الاجتماعية"
        : openSection === "feedback"
          ? "تنبيهات الشكاوي والمقترحات"
          : openSection === "municipal"
            ? `تنبيهات خدمات ${APP_NAME_AR}`
            : "";

  if (list.length === 0) {
    return <div className="gov-card p-10 text-center text-sm text-[var(--gov-muted)]">لا إشعارات حالياً</div>;
  }

  return (
    <div className="space-y-4">
      <div className="gov-card space-y-3 p-4">
        <p className="text-sm text-[var(--gov-muted)]">
          اختر الخدمة لعرض التنبيهات داخل نافذة منبثقة.
          {totalUnread > 0 ? ` يوجد ${totalUnread} تنبيه غير مقروء.` : ""}
        </p>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
          <button
            type="button"
            onClick={() => setOpenSection("gas")}
            className="inline-flex min-h-11 items-center justify-center rounded-lg border border-[var(--gov-border)] bg-white px-3 text-sm font-semibold text-[var(--gov-primary)] hover:bg-[#f3f5f7]"
          >
            اضغط لعرض تنبيهات الغاز ({gasList.length})
            {unreadGas > 0 ? (
              <span className="me-1 rounded-full bg-[var(--gov-primary)] px-2 py-0.5 text-xs text-white">{unreadGas}</span>
            ) : null}
          </button>
          <button
            type="button"
            onClick={() => setOpenSection("returnee")}
            className="inline-flex min-h-11 items-center justify-center rounded-lg border border-[var(--gov-border)] bg-white px-3 text-sm font-semibold text-[var(--gov-primary)] hover:bg-[#f3f5f7]"
          >
            اضغط لعرض تنبيهات العائدين ({returneeList.length})
            {unreadReturnee > 0 ? (
              <span className="me-1 rounded-full bg-[var(--gov-primary)] px-2 py-0.5 text-xs text-white">{unreadReturnee}</span>
            ) : null}
          </button>
          <button
            type="button"
            onClick={() => setOpenSection("feedback")}
            className="inline-flex min-h-11 items-center justify-center rounded-lg border border-[var(--gov-border)] bg-white px-3 text-sm font-semibold text-[var(--gov-text)] hover:bg-[#f3f5f7]"
          >
            تنبيهات الشكاوي ({feedbackList.length})
            {unreadFeedback > 0 ? (
              <span className="me-1 rounded-full bg-[var(--gov-primary)] px-2 py-0.5 text-xs text-white">{unreadFeedback}</span>
            ) : null}
          </button>
          <button
            type="button"
            onClick={() => setOpenSection("social")}
            className="inline-flex min-h-11 items-center justify-center rounded-lg border border-[var(--gov-border)] bg-white px-3 text-sm font-semibold text-[var(--gov-text)] hover:bg-[#f3f5f7]"
          >
            تنبيهات الخدمات الاجتماعية ({socialList.length})
            {unreadSocial > 0 ? (
              <span className="me-1 rounded-full bg-[var(--gov-primary)] px-2 py-0.5 text-xs text-white">{unreadSocial}</span>
            ) : null}
          </button>
          <button
            type="button"
            onClick={() => setOpenSection("municipal")}
            className="inline-flex min-h-11 items-center justify-center rounded-lg border border-[var(--gov-border)] bg-white px-3 text-sm font-semibold text-[var(--gov-text)] hover:bg-[#f3f5f7]"
          >
            اضغط لعرض تنبيهات البلدية ({municipalList.length})
            {unreadMunicipal > 0 ? (
              <span className="me-1 rounded-full bg-[var(--gov-primary)] px-2 py-0.5 text-xs text-white">{unreadMunicipal}</span>
            ) : null}
          </button>
        </div>
      </div>
      <NotificationsDialog
        title={currentTitle}
        open={openSection !== null}
        onClose={() => setOpenSection(null)}
        list={currentList}
        requestsBasePath={requestsBasePath}
        feedbackBasePath={feedbackBasePath}
      />
    </div>
  );
}
