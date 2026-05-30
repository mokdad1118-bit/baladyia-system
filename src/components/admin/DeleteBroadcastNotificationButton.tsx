"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { deleteBroadcastNotification } from "@/actions/admin-broadcast-notifications";

export function DeleteBroadcastNotificationButton({ id, title }: { id: string; title: string }) {
  const [pending, setPending] = useState(false);
  const router = useRouter();

  return (
    <button
      type="button"
      disabled={pending}
      className="rounded-sm border border-rose-200 px-2.5 py-1 text-xs font-semibold text-rose-700 transition hover:bg-rose-50 disabled:opacity-60"
      onClick={async () => {
        if (!window.confirm(`حذف الإشعار «${title}» من السجل؟ لا يمكن التراجع عن هذا الإجراء.`)) return;
        setPending(true);
        const result = await deleteBroadcastNotification(id);
        setPending(false);
        if (result.error) {
          window.alert(result.error);
          return;
        }
        router.refresh();
      }}
    >
      {pending ? "..." : "حذف"}
    </button>
  );
}
