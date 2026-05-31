"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { deleteAreaNewsPost } from "@/actions/admin-area-news";

export function DeleteAreaNewsPostButton({ id, title }: { id: string; title: string }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  return (
    <button
      type="button"
      disabled={pending}
      className="rounded-sm border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-800 disabled:opacity-60"
      onClick={async () => {
        if (!confirm(`حذف المنشور: ${title}؟`)) return;
        setPending(true);
        const res = await deleteAreaNewsPost(id);
        setPending(false);
        if (res.error) {
          alert(res.error);
          return;
        }
        router.refresh();
      }}
    >
      {pending ? "..." : "حذف"}
    </button>
  );
}
