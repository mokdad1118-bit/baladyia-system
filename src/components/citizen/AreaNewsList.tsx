type AreaNewsRow = {
  id: string;
  title: string;
  body: string;
  municipalityName: string | null;
  authorName: string | null;
  createdAt: string;
};

export function AreaNewsList({ posts }: { posts: AreaNewsRow[] }) {
  return (
    <div className="gov-panel w-full min-w-0 max-w-full">
      <header className="gov-page-heading mb-6 border-b border-[var(--gov-border)] pb-4">
        <h1 className="text-lg font-bold text-[var(--gov-text)] md:text-xl">أخبار المنطقة</h1>
        <p className="mt-1 text-sm text-[var(--gov-muted)]">آخر المناشير الصادرة عن الإدارة.</p>
      </header>

      {posts.length === 0 ? (
        <p className="rounded-xl border border-[var(--gov-border)] bg-white px-4 py-3 text-sm text-[var(--gov-muted)]">
          لا توجد أخبار منشورة حالياً.
        </p>
      ) : (
        <div className="space-y-4">
          {posts.map((post) => (
            <article key={post.id} className="rounded-xl border border-[var(--gov-border)] bg-white p-4 shadow-sm">
              <div className="border-b border-slate-100 pb-3">
                <h2 className="text-base font-bold text-[var(--gov-text)]">{post.title}</h2>
                <p className="mt-1 text-xs text-[var(--gov-muted)]">
                  {post.municipalityName ?? "محافظة درعا"} - {post.authorName ?? "الإدارة"} -{" "}
                  <span dir="ltr">{new Date(post.createdAt).toLocaleString("ar-SY")}</span>
                </p>
              </div>
              <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-slate-700">{post.body}</p>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
