"use server";

import { revalidatePath } from "next/cache";
import type { Session } from "next-auth";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { UserRole } from "@/generated/prisma/enums";
import { isSuperAdminRole } from "@/lib/roles";
import { assertStaffCanAccessMunicipality } from "@/lib/municipality-scope";
import { staffCanManageAreaNews } from "@/lib/staff-permissions";
import { writeOperationLog } from "@/lib/operation-log";

export type AreaNewsActionState = { error: string } | { ok: true; message: string } | undefined;

function clean(value: FormDataEntryValue | null, max: number) {
  return String(value ?? "").trim().slice(0, max);
}

function resolveTargetMunicipalityId(
  session: Session | null,
  formData: FormData,
): { municipalityId: string | null } | { error: string } {
  if (!session?.user) return { error: "غير مصرّح" } as const;
  if (isSuperAdminRole(session.user.role)) {
    const raw = clean(formData.get("municipalityId"), 120);
    return { municipalityId: raw === "__ALL__" || raw === "" ? null : raw } as const;
  }
  const municipalityId = session.user.municipalityId?.trim();
  if (!municipalityId) return { error: "حسابك غير مرتبط ببلدية." } as const;
  return { municipalityId } as const;
}

export async function createAreaNewsPost(
  _prev: AreaNewsActionState,
  formData: FormData,
): Promise<AreaNewsActionState> {
  const session = await auth();
  if (!staffCanManageAreaNews(session)) return { error: "غير مصرّح" };

  const target = resolveTargetMunicipalityId(session, formData);
  if ("error" in target) return { error: target.error };
  const { municipalityId } = target;

  if (municipalityId) {
    try {
      assertStaffCanAccessMunicipality(session, municipalityId);
    } catch {
      return { error: "غير مصرّح" };
    }
    const municipality = await db.municipality.findUnique({ where: { id: municipalityId }, select: { id: true } });
    if (!municipality) return { error: "البلدية غير موجودة." };
  }

  const title = clean(formData.get("title"), 120);
  const body = clean(formData.get("body"), 3000);
  if (title.length < 3) return { error: "أدخل عنوان الخبر." };
  if (body.length < 5) return { error: "أدخل نص المنشور." };

  const created = await db.areaNewsPost.create({
    data: {
      municipalityId,
      authorId: session!.user!.id,
      title,
      body,
      isPublished: true,
    },
  });

  await writeOperationLog({
    session,
    municipalityId,
    action: "CREATE",
    module: "AREA_NEWS",
    title: "نشر خبر منطقة",
    description: title,
    entityType: "AREA_NEWS_POST",
    entityId: created.id,
    metadata: { municipalityId, title },
  });

  revalidatePath("/admin/area-news");
  revalidatePath("/citizen/news");
  revalidatePath("/news");
  return { ok: true, message: "تم نشر الخبر بنجاح." };
}

export async function deleteAreaNewsPost(id: string): Promise<{ ok?: true; error?: string }> {
  const session = await auth();
  if (!staffCanManageAreaNews(session)) return { error: "غير مصرّح" };

  const post = await db.areaNewsPost.findUnique({
    where: { id },
    select: { id: true, title: true, municipalityId: true },
  });
  if (!post) return { error: "المنشور غير موجود." };

  if (post.municipalityId) {
    try {
      assertStaffCanAccessMunicipality(session, post.municipalityId);
    } catch {
      return { error: "غير مصرّح" };
    }
  } else if (session?.user.role !== UserRole.SUPER_ADMIN) {
    return { error: "غير مصرّح" };
  }

  await db.areaNewsPost.delete({ where: { id } });
  await writeOperationLog({
    session,
    municipalityId: post.municipalityId,
    action: "DELETE",
    module: "AREA_NEWS",
    title: "حذف خبر منطقة",
    description: post.title,
    entityType: "AREA_NEWS_POST",
    entityId: post.id,
    metadata: post,
  });

  revalidatePath("/admin/area-news");
  revalidatePath("/citizen/news");
  revalidatePath("/news");
  return { ok: true };
}

export async function replyToAreaNewsComment(
  _prev: AreaNewsActionState,
  formData: FormData,
): Promise<AreaNewsActionState> {
  const session = await auth();
  if (!staffCanManageAreaNews(session)) return { error: "غير مصرّح" };

  const commentId = clean(formData.get("commentId"), 120);
  const body = clean(formData.get("body"), 1000);
  if (!commentId) return { error: "التعليق غير محدد." };
  if (body.length < 2) return { error: "اكتب رداً واضحاً." };

  const comment = await db.areaNewsComment.findUnique({
    where: { id: commentId },
    select: {
      id: true,
      postId: true,
      municipalityId: true,
      body: true,
      citizen: { select: { name: true } },
      post: { select: { title: true, municipalityId: true } },
    },
  });
  if (!comment) return { error: "التعليق غير موجود." };

  try {
    assertStaffCanAccessMunicipality(session, comment.municipalityId);
  } catch {
    return { error: "غير مصرّح" };
  }

  const created = await db.areaNewsCommentReply.create({
    data: {
      postId: comment.postId,
      commentId: comment.id,
      municipalityId: comment.municipalityId,
      adminId: session!.user!.id,
      body,
    },
  });

  await writeOperationLog({
    session,
    municipalityId: comment.municipalityId,
    action: "REPLY",
    module: "AREA_NEWS",
    title: "رد إداري على تعليق خبر المنطقة",
    entityType: "AREA_NEWS_COMMENT_REPLY",
    entityId: created.id,
    metadata: {
      postId: comment.postId,
      postTitle: comment.post.title,
      commentId: comment.id,
      citizenName: comment.citizen.name,
      reply: body,
    },
  });

  revalidatePath("/admin/area-news");
  revalidatePath("/citizen/news");
  revalidatePath("/news");
  return { ok: true, message: "تم إرسال الرد." };
}
