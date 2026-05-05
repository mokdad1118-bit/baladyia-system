"use client";

import { useState } from "react";
import { setUserActive } from "@/actions/admin-users";
import { Button } from "@/components/ui/button";

export function GasAgentToggleButton({
  userId,
  isActive,
  name,
}: {
  userId: string;
  isActive: boolean;
  name: string;
}) {
  const [pending, setPending] = useState(false);

  return (
    <Button
      type="button"
      variant={isActive ? "outline" : "secondary"}
      size="sm"
      disabled={pending}
      onClick={async () => {
        const ok = window.confirm(
          isActive ? `إيقاف حساب المعتمد «${name}»؟` : `تفعيل حساب المعتمد «${name}»؟`,
        );
        if (!ok) return;
        setPending(true);
        await setUserActive(userId, !isActive);
        window.location.reload();
      }}
    >
      {isActive ? "إيقاف" : "تفعيل"}
    </Button>
  );
}
