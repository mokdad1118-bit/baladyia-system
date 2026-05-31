import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { UserRole } from "@/generated/prisma/enums";
import { visibleAreaNewsWhere } from "@/lib/area-news";
import { AreaNewsList } from "@/components/citizen/AreaNewsList";
import { AreaNewsReadMarker } from "@/components/citizen/AreaNewsReadMarker";

export default async function CitizenAreaNewsPage() {
  const session = await auth();
  if (!session?.user) redirect("/citizen/welcome?next=/citizen/news");
  if (session.user.role !== UserRole.CITIZEN) redirect("/");
  const municipalityId = session.user.municipalityId?.trim();
  if (!municipalityId) redirect("/citizen/account");

  const posts = await db.areaNewsPost.findMany({
    where: visibleAreaNewsWhere(municipalityId),
    orderBy: { createdAt: "desc" },
    take: 100,
    include: {
      municipality: { select: { name: true } },
      author: { select: { name: true } },
      likes: {
        select: { citizenId: true },
      },
      comments: {
        where: { municipalityId },
        orderBy: { createdAt: "desc" },
        take: 5,
        include: { citizen: { select: { name: true } } },
      },
      _count: {
        select: {
          likes: true,
          comments: { where: { municipalityId } },
        },
      },
    },
  });

  return (
    <>
      <AreaNewsReadMarker />
      <AreaNewsList
        posts={posts.map((post) => ({
          id: post.id,
          title: post.title,
          body: post.body,
          municipalityName: post.municipality?.name ?? null,
          authorName: post.author?.name ?? null,
          createdAt: post.createdAt.toISOString(),
          likesCount: post._count.likes,
          commentsCount: post._count.comments,
          likedByMe: post.likes.some((like) => like.citizenId === session.user.id),
          comments: post.comments.map((comment) => ({
            id: comment.id,
            body: comment.body,
            createdAt: comment.createdAt.toISOString(),
            citizenName: comment.citizen.name,
          })),
        }))}
      />
    </>
  );
}
