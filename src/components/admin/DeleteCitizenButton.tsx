"use client";

import { useState } from "react";
import { deleteCitizenAccount } from "@/actions/admin-users";
import { Button } from "@/components/ui/button";

export function DeleteCitizenButton({ userId, name }: { userId: string; name: string }) {
  const [pending, setPending] = useState(false);

  return (
    <Button
      type="button"
      variant="danger"
      size="sm"
      disabled={pending}
      onClick={async () => {
        const ok = window.confirm(
          `حذف حساب «${name}» نهائياً من النظام؟\n\n` +
            "سيتم حذف جميع طلبات هذا المواطن ومرفقاتها وسجلاتها ولن يمكن استرجاعها.\n" +
            "بعد الحذف يمكن للمواطن التسجيل من جديد بنفس البريد أو الهاتف أو الرقم الوطني.",
        );
        if (!ok) return;
        setPending(true);
        const res = await deleteCitizenAccount(userId);
        setPending(false);
        if ("error" in res && res.error) {
          window.alert(res.error);
          return;
        }
        window.location.reload();
      }}
    >
      حذف الحساب
    </Button>
  );
}
