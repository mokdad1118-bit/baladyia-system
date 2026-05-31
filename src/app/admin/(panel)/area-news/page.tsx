import { auth } from "@/auth";
import { db } from "@/lib/db";
import { requireStaffPanelPermission } from "@/lib/admin-guard";
import { isSuperAdminRole } from "@/lib/roles";
import { staffMunicipalityIdFilter } from "@/lib/municipality-scope";
import { listActiveMunicipalities } from "@/lib/municipalities";
import { PageHeader } from "@/components/ui/page-header";
import { AreaNewsPostForm } from "@/components/admin/AreaNewsPostForm";
import { DeleteAreaNewsPostButton } from "@/components/admin/DeleteAreaNewsPostButton";

export default async function AdminAreaNewsPage() {
  const session = await auth();
  await requireStaffPanelPermission(session, "areaNews");
  const isSuperAdmin = isSuperAdminRole(session!.user!.role);
  const municipalityScope = staffMunicipalityIdFilter(session);
  const ownMunicipalityId = "municipalityId" in municipalityScope ? municipalityScope.municipalityId : "__none__";

  const [municipalities, posts] = await Promise.all([
    isSuperAdmin ? listActiveMunicipalities() : Promise.resolve([]),
    db.areaNewsPost.findMany({
      where: isSuperAdmin ? {} : { municipalityId: ownMunicipalityId },
      orderBy: { createdAt: "desc" },
      take: 100,
      include: {
        municipality: { select: { name: true } },
        author: { select: { name: true, role: true } },
      },
    }),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader title="أخبار المنطقة" description="مناشير تظهر داخل تطبيق المواطن حسب نطاق البلدية." />
      <AreaNewsPostForm municipalities={municipalities} canSelectMunicipality={isSuperAdmin} />

      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-slate-700">المناشير المنشورة</h2>
        {posts.length === 0 ? (
          <p className="rounded border border-[var(--gov-border)] bg-white p-4 text-sm text-[var(--gov-muted)]">
            لا توجد مناشير بعد.
          </p>
        ) : (
          <div className="space-y-3">
            {posts.map((post) => (
              <article key={post.id} className="rounded border border-[var(--gov-border)] bg-white p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="text-base font-bold text-[var(--gov-text)]">{post.title}</h3>
                    <p className="mt-1 text-xs text-[var(--gov-muted)]">
                      {post.municipality?.name ?? "كل بلديات محافظة درعا"} - {post.author?.name ?? "غير معروف"} -{" "}
                      <span dir="ltr">{post.createdAt.toLocaleString("ar-SY")}</span>
                    </p>
                  </div>
                  <DeleteAreaNewsPostButton id={post.id} title={post.title} />
                </div>
                <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-slate-700">{post.body}</p>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
