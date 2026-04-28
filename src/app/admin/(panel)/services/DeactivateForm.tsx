"use client";

import { useActionState } from "react";
import { deleteServiceByForm } from "@/actions/admin-services";
import { Button } from "@/components/ui/button";

export function DeactivateForm({ serviceId }: { serviceId: string }) {
  const [st, act] = useActionState(deleteServiceByForm, undefined);
  return (
    <form action={act}>
      <input type="hidden" name="serviceId" value={serviceId} />
      {st?.error && <span className="me-2 text-xs text-rose-600">{st.error}</span>}
      <Button type="submit" variant="ghost" className="text-rose-600 hover:bg-rose-50" size="sm">
        إلغاء تفعيل
      </Button>
    </form>
  );
}
