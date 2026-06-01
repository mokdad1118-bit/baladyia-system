"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { UserRole } from "@/generated/prisma/enums";
import { visibleAreaNewsWhere } from "@/lib/area-news";
import { writeOperationLog } from "@/lib/operation-log";

export type AreaNewsCommentState = { error: string } | { ok: true } | undefined;

async function requireCitizenContext() {
  const session = await auth();
  if (!session?.user || session.user.role !== UserRole.CITIZEN) return null;
  const municipalityId = session.user.municipalityId?.trim();
  if (!municipalityId) return null;
  return { session, municipalityId };
}

async function findVisiblePost(postId: string, municipalityId: string) {
  return db.areaNewsPost.findFirst({
    where: {
      id: postId,
      ...visibleAreaNewsWhere(municipalityId),
    },
    select: { id: true, title: true },
  });
}

export async function toggleAreaNewsLike(postId: string): Promise<{ ok?: true; liked?: boolean; error?: string }> {
  const ctx = await requireCitizenContext();
  if (!ctx) return { error: "غير مصرح" };

  const post = await findVisiblePost(postId, ctx.municipalityId);
  if (!post) return { error: "المنشور غير متاح" };

  const existing = await db.areaNewsLike.findUnique({
    where: { postId_citizenId: { postId, citizenId: ctx.session.user.id } },
    select: { id: true },
  });

  if (existing) {
    await db.areaNewsLike.delete({ where: { id: existing.id } });
  } else {
    await db.areaNewsLike.create({
      data: {
        postId,
        municipalityId: ctx.municipalityId,
        citizenId: ctx.session.user.id,
      },
    });
  }

  await writeOperationLog({
    session: ctx.session,
    municipalityId: ctx.municipalityId,
    action: existing ? "UNLIKE" : "LIKE",
    module: "AREA_NEWS",
    title: existing ? "إزالة إعجاب عن خبر" : "إعجاب بخبر",
    entityType: "AreaNewsPost",
    entityId: postId,
    metadata: { title: post.title },
  });

  revalidatePath("/citizen/news");
  revalidatePath("/news");
  revalidatePath("/admin/area-news");
  return { ok: true, liked: !existing };
}

export async function createAreaNewsComment(
  _prev: AreaNewsCommentState,
  formData: FormData,
): Promise<AreaNewsCommentState> {
  const ctx = await requireCitizenContext();
  if (!ctx) return { error: "غير مصرح" };

  const postId = String(formData.get("postId") ?? "").trim();
  const parentCommentId = String(formData.get("parentCommentId") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();
  if (!postId) return { error: "المنشور غير محدد" };
  if (parentCommentId) return { error: "الرد على التعليقات متاح للإدارة فقط" };
  if (body.length < 2) return { error: "اكتب تعليقاً واضحاً" };
  if (body.length > 700) return { error: "التعليق طويل جداً" };

  const post = await findVisiblePost(postId, ctx.municipalityId);
  if (!post) return { error: "المنشور غير متاح" };

  await db.areaNewsComment.create({
    data: {
      postId,
      municipalityId: ctx.municipalityId,
      citizenId: ctx.session.user.id,
      body,
    },
  });

  await writeOperationLog({
    session: ctx.session,
    municipalityId: ctx.municipalityId,
    action: "COMMENT",
    module: "AREA_NEWS",
    title: "تعليق على خبر المنطقة",
    entityType: "AreaNewsPost",
    entityId: postId,
    metadata: { title: post.title, comment: body },
  });

  revalidatePath("/citizen/news");
  revalidatePath("/news");
  revalidatePath("/admin/area-news");
  return { ok: true };
}
