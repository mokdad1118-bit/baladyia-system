import { auth } from "@/auth";
import { db } from "@/lib/db";
import { requireStaffPanelPermission } from "@/lib/admin-guard";
import { isSuperAdminRole } from "@/lib/roles";
import { staffMunicipalityIdFilter } from "@/lib/municipality-scope";
import { listActiveMunicipalities } from "@/lib/municipalities";
import { PageHeader } from "@/components/ui/page-header";
import { AreaNewsPostForm } from "@/components/admin/AreaNewsPostForm";
import { DeleteAreaNewsPostButton } from "@/components/admin/DeleteAreaNewsPostButton";
import { AreaNewsCommentReplyForm } from "@/components/admin/AreaNewsCommentReplyForm";

export default async function AdminAreaNewsPage() {
  const session = await auth();
  await requireStaffPanelPermission(session, "areaNews");
  const isSuperAdmin = isSuperAdminRole(session!.user!.role);
  const municipalityScope = staffMunicipalityIdFilter(session);
  const ownMunicipalityId = "municipalityId" in municipalityScope ? municipalityScope.municipalityId : "__none__";
  const commentsWhere = isSuperAdmin ? { parentCommentId: null } : { municipalityId: ownMunicipalityId, parentCommentId: null };
  const postsWhere = isSuperAdmin
    ? {}
    : {
        OR: [
          { municipalityId: ownMunicipalityId },
          { municipalityId: null, comments: { some: { municipalityId: ownMunicipalityId } } },
        ],
      };

  const [municipalities, posts] = await Promise.all([
    isSuperAdmin ? listActiveMunicipalities() : Promise.resolve([]),
    db.areaNewsPost.findMany({
      where: postsWhere,
      orderBy: { createdAt: "desc" },
      take: 100,
      include: {
        municipality: { select: { name: true } },
        author: { select: { name: true, role: true } },
        _count: {
          select: {
            likes: isSuperAdmin ? true : { where: { municipalityId: ownMunicipalityId } },
            comments: isSuperAdmin
              ? { where: { parentCommentId: null } }
              : { where: { municipalityId: ownMunicipalityId, parentCommentId: null } },
          },
        },
        comments: {
          where: commentsWhere,
          orderBy: { createdAt: "desc" },
          take: 20,
          include: {
            municipality: { select: { name: true } },
            citizen: { select: { name: true, phone: true, nationalId: true } },
            adminReplies: {
              orderBy: { createdAt: "asc" },
              include: { admin: { select: { name: true } } },
            },
          },
        },
      },
    }),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader title="أخبار المنطقة" description="مناشير تظهر داخل تطبيق المواطن حسب نطاق البلدية مع تعليقات وإعجابات المواطنين." />
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
                    <p className="mt-2 flex flex-wrap gap-2 text-xs font-semibold text-[var(--gov-muted)]">
                      <span className="rounded-full bg-slate-100 px-2 py-1">{post._count.likes} إعجاب</span>
                      <span className="rounded-full bg-slate-100 px-2 py-1">{post._count.comments} تعليق</span>
                    </p>
                  </div>
                  <DeleteAreaNewsPostButton id={post.id} title={post.title} />
                </div>
                <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-slate-700">{post.body}</p>

                {post.comments.length ? (
                  <div className="mt-4 border-t border-slate-100 pt-3">
                    <h4 className="text-sm font-bold text-[var(--gov-text)]">تعليقات المواطنين</h4>
                    <div className="mt-2 space-y-2">
                      {post.comments.map((comment) => (
                        <div key={comment.id} className="rounded-lg bg-slate-50 px-3 py-2 text-sm">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <p className="font-semibold text-[var(--gov-text)]">
                              {comment.citizen.name} - {comment.municipality.name}
                            </p>
                            <time className="text-xs text-[var(--gov-muted)]" dateTime={comment.createdAt.toISOString()}>
                              {comment.createdAt.toLocaleString("ar-SY")}
                            </time>
                          </div>
                          <p className="mt-1 text-xs text-[var(--gov-muted)]">
                            {comment.citizen.phone ?? "-"} - {comment.citizen.nationalId ?? "-"}
                          </p>
                          <p className="mt-2 whitespace-pre-wrap leading-6 text-slate-700">{comment.body}</p>
                          <AreaNewsCommentReplyForm commentId={comment.id} />
                          {comment.adminReplies.length ? (
                            <div className="mt-3 space-y-2 border-r-2 border-[var(--gov-border)] pr-3">
                              {comment.adminReplies.map((reply) => (
                                <div key={reply.id} className="rounded-lg bg-white px-3 py-2">
                                  <div className="flex flex-wrap items-center justify-between gap-2">
                                    <p className="font-semibold text-[var(--gov-primary)]">
                                      {reply.admin.name} - الإدارة
                                    </p>
                                    <time className="text-xs text-[var(--gov-muted)]" dateTime={reply.createdAt.toISOString()}>
                                      {reply.createdAt.toLocaleString("ar-SY")}
                                    </time>
                                  </div>
                                  <p className="mt-1 whitespace-pre-wrap leading-6 text-slate-700">{reply.body}</p>
                                </div>
                              ))}
                            </div>
                          ) : null}
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
