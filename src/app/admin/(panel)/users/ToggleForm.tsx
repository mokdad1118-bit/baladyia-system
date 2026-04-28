"use client";

import { setUserActive } from "@/actions/admin-users";
import { useState } from "react";
import { Button } from "@/components/ui/button";

export function ToggleForm({
  userId,
  isActive,
}: {
  userId: string;
  isActive: boolean;
}) {
  const [p, setP] = useState(false);
  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      disabled={p}
      onClick={async () => {
        if (!confirm(isActive ? "تعطيل هذا المستخدم؟" : "تفعيل؟")) return;
        setP(true);
        await setUserActive(userId, !isActive);
        window.location.reload();
      }}
    >
      {isActive ? "تعطيل" : "تفعيل"}
    </Button>
  );
}
