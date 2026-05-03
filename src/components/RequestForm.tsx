"use client";

import type { Service, ServiceDocument } from "@/generated/prisma/client";
import { CitizenRequestWizard } from "@/components/citizen/CitizenRequestWizard";

type Prefill = {
  name: string;
  phone: string | null;
  email: string | null;
  notificationEmail: string | null;
};

/** نموذج تقديم طلب مواطن — خطوات داخلية (بيانات / مرفقات / مراجعة) */
export function RequestForm({
  service,
  prefill,
}: {
  service: Service & { documents: ServiceDocument[] };
  prefill: Prefill | null;
}) {
  return <CitizenRequestWizard service={service} prefill={prefill} />;
}
