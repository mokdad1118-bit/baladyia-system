"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { ReturneeRegistrationStatus } from "@/generated/prisma/enums";
import { updateReturneeRegistrationStatusAction } from "@/actions/returnee-registration";
import {
  returneeRegistrationStatusLabelAr,
  returneeRegistrationStatusOrder,
} from "@/lib/returnee-registration-labels";

export function ReturneeRegistrationStatusSelect({
  registrationId,
  status,
}: {
  registrationId: string;
  status: ReturneeRegistrationStatus;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <select
      aria-label="حالة الطلب"
      value={status}
      disabled={pending}
      className="gov-input max-w-[12rem] px-2 py-2 text-sm"
      onChange={(e) => {
        const next = e.target.value as ReturneeRegistrationStatus;
        startTransition(async () => {
          const res = await updateReturneeRegistrationStatusAction(registrationId, next);
          if ("error" in res) {
            alert(res.error);
            router.refresh();
            return;
          }
          router.refresh();
        });
      }}
    >
      {returneeRegistrationStatusOrder.map((v) => (
        <option key={v} value={v}>
          {returneeRegistrationStatusLabelAr[v]}
        </option>
      ))}
    </select>
  );
}
