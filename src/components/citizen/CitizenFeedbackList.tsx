export function CitizenFeedbackList({
  items,
}: {
  items: {
    id: string;
    message: string;
    imagePath: string | null;
    imageOriginal: string | null;
    createdAt: Date;
    adminReply: string | null;
    adminReplyAt: Date | null;
  }[];
}) {
  if (items.length === 0) {
    return (
      <p className="mb-6 rounded-xl border border-dashed border-[var(--gov-border)] bg-white/60 px-4 py-6 text-center text-sm text-[var(--gov-muted)]">
        لم ترسل أي شكوى أو مقترحاً بعد. يمكنك استخدام النموذج أدناه.
      </p>
    );
  }

  return (
    <section className="mb-8 space-y-4">
      <h2 className="text-base font-bold text-[var(--gov-text)]">شكاواك ومقترحاتك</h2>
      <ul className="space-y-3">
        {items.map((item) => (
          <li key={item.id}>
            <article
              id={`citizen-feedback-${item.id}`}
              className="gov-card scroll-mt-24 space-y-3 p-4 md:p-5"
            >
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <span className="text-xs font-semibold text-[var(--gov-muted)]">رسالتك</span>
                <time className="text-xs text-[var(--gov-muted)]" dateTime={item.createdAt.toISOString()}>
                  {item.createdAt.toLocaleString("ar")}
                </time>
              </div>
              <p className="whitespace-pre-wrap text-sm text-[var(--gov-text)]">{item.message}</p>
              {item.imagePath ? (
                <a
                  href={item.imagePath}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block overflow-hidden rounded-lg border border-[var(--gov-border)] bg-slate-50 no-underline"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element -- citizen-uploaded complaint image */}
                  <img
                    src={item.imagePath}
                    alt={item.imageOriginal ?? "صورة الشكوى"}
                    className="max-h-64 w-full object-contain"
                  />
                  <span className="block px-3 py-2 text-xs text-[var(--gov-muted)]">
                    {item.imageOriginal ?? "صورة الشكوى"}
                  </span>
                </a>
              ) : null}
              {item.adminReply ? (
                <div className="rounded-xl border border-[var(--gov-primary)]/25 bg-[var(--gov-primary)]/6 px-3 py-3">
                  <p className="text-xs font-semibold text-[var(--gov-primary)]">رد الإدارة</p>
                  <p className="mt-1 whitespace-pre-wrap text-sm text-[var(--gov-text)]">{item.adminReply}</p>
                  {item.adminReplyAt ? (
                    <p className="mt-2 text-xs text-[var(--gov-muted)]">
                      {item.adminReplyAt.toLocaleString("ar")}
                    </p>
                  ) : null}
                </div>
              ) : (
                <p className="text-xs text-[var(--gov-muted)]">لم يصدر رد من الإدارة بعد.</p>
              )}
            </article>
          </li>
        ))}
      </ul>
    </section>
  );
}
