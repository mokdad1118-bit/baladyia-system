"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { SocialServiceCaseStatus } from "@/generated/prisma/enums";
import { updateSocialServiceCaseStatusAction } from "@/actions/social-service-case";
import { socialServiceStatusLabelAr, socialServiceStatusOrder } from "@/lib/social-service-labels";

export function SocialServiceCaseStatusSelect({ caseId, status }: { caseId: string; status: SocialServiceCaseStatus }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  return (
    <select
      aria-label="حالة الطلب"
      value={status}
      disabled={pending}
      className="gov-input max-w-[12rem] px-2 py-2 text-sm"
      onChange={(e) => {
        const next = e.target.value as SocialServiceCaseStatus;
        startTransition(async () => {
          const res = await updateSocialServiceCaseStatusAction(caseId, next);
          if ("error" in res) {
            alert(res.error);
          }
          router.refresh();
        });
      }}
    >
      {socialServiceStatusOrder.map((v) => (
        <option key={v} value={v}>
          {socialServiceStatusLabelAr[v]}
        </option>
      ))}
    </select>
  );
}
