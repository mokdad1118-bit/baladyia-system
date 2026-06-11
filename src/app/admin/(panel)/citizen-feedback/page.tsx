import { auth } from "@/auth";
import { db } from "@/lib/db";
import { ADMIN_NAV_BADGE_NOTIFICATION_TYPES } from "@/lib/admin-nav-badges";
import { AdminCitizenFeedbackReplyForm } from "@/components/admin/AdminCitizenFeedbackReplyForm";
import { staffMunicipalityIdFilter } from "@/lib/municipality-scope";
import { requireStaffPanelPermission } from "@/lib/admin-guard";

export default async function AdminCitizenFeedbackPage() {
  const session = await auth();
  await requireStaffPanelPermission(session, "feedback");
  const mun = staffMunicipalityIdFilter(session);
  if (session?.user) {
    await db.notification.updateMany({
      where: {
        userId: session.user.id,
        read: false,
        type: { in: [...ADMIN_NAV_BADGE_NOTIFICATION_TYPES.feedback] },
      },
      data: { read: true },
    });
  }

  const rows = await db.citizenFeedback.findMany({
    where: mun,
    orderBy: { createdAt: "desc" },
    take: 500,
    include: {
      citizen: {
        select: {
          name: true,
          email: true,
          phone: true,
          nationalId: true,
          notificationEmail: true,
        },
      },
      municipality: {
        select: { name: true, governorate: true },
      },
      adminRepliedBy: {
        select: { name: true },
      },
    },
  });

  return (
    <div>
      <header className="gov-page-heading mb-6 border-b border-[var(--gov-border)] pb-4">
        <h1 className="text-lg font-bold text-[var(--gov-text)] md:text-xl">شكاوي واقتراحات المواطنين</h1>
        <p className="mt-1 text-sm text-[var(--gov-muted)]">
          جميع الملاحظات المرسلة من داخل تطبيق المواطن بخصوص الأعطال أو المقترحات.
        </p>
      </header>

      {rows.length === 0 ? (
        <p className="rounded-xl border border-[var(--gov-border)] bg-white px-4 py-3 text-sm text-[var(--gov-muted)]">
          لا توجد شكاوى أو مقترحات حتى الآن.
        </p>
      ) : (
        <div className="gov-table-wrap overflow-x-auto">
          <table className="gov-table min-w-[88rem]">
            <thead>
              <tr>
                <th>المواطن</th>
                <th>البلدية</th>
                <th>البريد</th>
                <th>الهاتف</th>
                <th>الرقم الوطني</th>
                <th>نص الشكوى / المقترح</th>
                <th>صورة الشكوى</th>
                <th>رد الإدارة الحالي</th>
                <th>الرد على المواطن</th>
                <th>تاريخ الإرسال</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id}>
                  <td>
                    <div className="font-medium text-[var(--gov-text)]">{row.citizen?.name ?? "مواطن محذوف"}</div>
                    <div className="mt-1 text-xs text-[var(--gov-muted)]">
                      بريد الإشعارات:{" "}
                      <span dir="ltr" className="break-all">
                        {row.citizen?.notificationEmail ?? "—"}
                      </span>
                    </div>
                  </td>
                  <td>
                    <div className="font-medium text-[var(--gov-text)]">{row.municipality?.name ?? "—"}</div>
                    <div className="mt-1 text-xs text-[var(--gov-muted)]">{row.municipality?.governorate ?? ""}</div>
                  </td>
                  <td dir="ltr" className="max-w-[14rem] break-all text-sm">
                    {row.citizen?.email ?? "—"}
                  </td>
                  <td dir="ltr">{row.citizen?.phone ?? "—"}</td>
                  <td dir="ltr">{row.citizen?.nationalId ?? "—"}</td>
                  <td className="max-w-[28rem] whitespace-pre-wrap break-words">{row.message}</td>
                  <td className="min-w-[10rem]">
                    {row.imagePath ? (
                      <a
                        href={row.imagePath}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block overflow-hidden rounded border border-[var(--gov-border)] bg-slate-50 text-xs no-underline"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element -- citizen-uploaded complaint image */}
                        <img
                          src={row.imagePath}
                          alt={row.imageOriginal ?? "صورة الشكوى"}
                          className="h-24 w-40 object-cover"
                        />
                        <span className="block px-2 py-1 text-[var(--gov-primary)]">فتح الصورة</span>
                      </a>
                    ) : (
                      <span className="text-[var(--gov-muted)]">—</span>
                    )}
                  </td>
                  <td className="max-w-[20rem] whitespace-pre-wrap break-words text-sm">
                    {row.adminReply ? (
                      <>
                        <span className="text-[var(--gov-text)]">{row.adminReply}</span>
                        {row.adminReplyAt ? (
                          <span className="mt-1 block text-xs text-[var(--gov-muted)]">
                            {row.adminReplyAt.toLocaleString("ar")}
                            {row.adminRepliedBy ? ` · ${row.adminRepliedBy.name}` : ""}
                          </span>
                        ) : null}
                      </>
                    ) : (
                      <span className="text-[var(--gov-muted)]">—</span>
                    )}
                  </td>
                  <td className="align-top">
                    <AdminCitizenFeedbackReplyForm feedbackId={row.id} existingReply={row.adminReply} />
                  </td>
                  <td className="whitespace-nowrap text-[var(--gov-muted)]">
                    {row.createdAt.toLocaleString("ar")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
