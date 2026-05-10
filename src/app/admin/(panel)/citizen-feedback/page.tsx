import { db } from "@/lib/db";

export default async function AdminCitizenFeedbackPage() {
  const rows = await db.citizenFeedback.findMany({
    orderBy: { createdAt: "desc" },
    take: 500,
    include: {
      citizen: {
        select: {
          name: true,
          email: true,
          phone: true,
        },
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
          <table className="gov-table min-w-[56rem]">
            <thead>
              <tr>
                <th>المواطن</th>
                <th>البريد</th>
                <th>الهاتف</th>
                <th>نص الشكوى / المقترح</th>
                <th>تاريخ الإرسال</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id}>
                  <td>{row.citizen.name}</td>
                  <td dir="ltr" className="max-w-[14rem] break-all text-sm">
                    {row.citizen.email ?? "—"}
                  </td>
                  <td dir="ltr">{row.citizen.phone ?? "—"}</td>
                  <td className="max-w-[32rem] whitespace-pre-wrap break-words">{row.message}</td>
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
