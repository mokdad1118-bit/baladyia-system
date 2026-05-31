"use client";

import { useActionState, useTransition } from "react";
import { useFormStatus } from "react-dom";
import {
  createAreaNewsComment,
  toggleAreaNewsLike,
  type AreaNewsCommentState,
} from "@/actions/area-news-interactions";
import { cn } from "@/lib/cn";

type AreaNewsRow = {
  id: string;
  title: string;
  body: string;
  municipalityName: string | null;
  authorName: string | null;
  createdAt: string;
  likesCount: number;
  commentsCount: number;
  likedByMe: boolean;
  comments: {
    id: string;
    body: string;
    createdAt: string;
    citizenName: string;
  }[];
};

function CommentSubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="gov-btn-primary shrink-0 px-4 py-2 text-xs font-semibold" disabled={pending}>
      {pending ? "جار الإرسال..." : "تعليق"}
    </button>
  );
}

function CommentForm({ postId }: { postId: string }) {
  const [state, action] = useActionState<AreaNewsCommentState, FormData>(createAreaNewsComment, undefined);
  return (
    <form action={action} className="mt-3 flex items-start gap-2">
      <input type="hidden" name="postId" value={postId} />
      <textarea
        name="body"
        className="gov-input min-h-10 flex-1 resize-none px-3 py-2 text-sm"
        maxLength={700}
        rows={1}
        placeholder="اكتب تعليقك..."
      />
      <CommentSubmitButton />
      {state && "error" in state ? <p className="sr-only" role="alert">{state.error}</p> : null}
    </form>
  );
}

function LikeButton({ postId, liked, count }: { postId: string; liked: boolean; count: number }) {
  const [pending, startTransition] = useTransition();
  return (
    <button
      type="button"
      className={cn(
        "inline-flex min-h-10 items-center gap-2 rounded-full border px-3 text-sm font-semibold transition",
        liked
          ? "border-[var(--gov-primary)] bg-[#e4f0ea] text-[var(--gov-primary)]"
          : "border-[var(--gov-border)] bg-white text-[var(--gov-muted)]",
      )}
      disabled={pending}
      onClick={() => {
        startTransition(async () => {
          await toggleAreaNewsLike(postId);
        });
      }}
      aria-pressed={liked}
    >
      <span aria-hidden>{liked ? "♥" : "♡"}</span>
      <span>{count}</span>
    </button>
  );
}

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

              <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-3">
                <LikeButton postId={post.id} liked={post.likedByMe} count={post.likesCount} />
                <span className="inline-flex min-h-10 items-center rounded-full border border-[var(--gov-border)] bg-slate-50 px-3 text-sm font-semibold text-[var(--gov-muted)]">
                  {post.commentsCount} تعليق
                </span>
              </div>

              <CommentForm postId={post.id} />

              {post.comments.length ? (
                <div className="mt-4 space-y-2">
                  {post.comments.map((comment) => (
                    <div key={comment.id} className="rounded-lg bg-slate-50 px-3 py-2 text-sm">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="font-semibold text-[var(--gov-text)]">{comment.citizenName}</p>
                        <time className="text-xs text-[var(--gov-muted)]" dateTime={comment.createdAt}>
                          {new Date(comment.createdAt).toLocaleString("ar-SY")}
                        </time>
                      </div>
                      <p className="mt-1 whitespace-pre-wrap leading-6 text-slate-700">{comment.body}</p>
                    </div>
                  ))}
                </div>
              ) : null}
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
