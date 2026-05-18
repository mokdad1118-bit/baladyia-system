"use client";

import { useActionState } from "react";
import { upsertService } from "@/actions/admin-services";
import { ServiceDocRows } from "./ServiceDocRows";
import { FileKind } from "@/generated/prisma/enums";
import type { Service, ServiceDocument } from "@/generated/prisma/client";
import { Input, Textarea, FieldLabel, FieldGroup } from "@/components/ui/field";
import { Button } from "@/components/ui/button";

export function ServiceForm({
  service,
  municipalities = [],
}: {
  service?: Service & { documents: ServiceDocument[] };
  municipalities?: { id: string; name: string }[];
}) {
  const [state, formAction] = useActionState(upsertService, undefined);
  return (
    <form action={formAction} className="space-y-6 max-w-3xl">
      {state?.error && (
        <p className="rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-800">{state.error}</p>
      )}
      {service && <input type="hidden" name="id" value={service.id} />}
      {!service && municipalities.length > 0 ? (
        <FieldGroup>
          <FieldLabel>البلدية *</FieldLabel>
          <select
            name="municipalityId"
            required
            className="w-full rounded-xl border border-slate-200/90 bg-white px-3 py-2.5 text-sm"
            defaultValue=""
          >
            <option value="" disabled>
              — اختر البلدية —
            </option>
            {municipalities.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
        </FieldGroup>
      ) : null}
      <FieldGroup>
        <FieldLabel>اسم الخدمة *</FieldLabel>
        <Input name="name" required defaultValue={service?.name} />
      </FieldGroup>
      <FieldGroup>
        <FieldLabel>وصف مُختصر</FieldLabel>
        <Textarea name="description" rows={3} defaultValue={service?.description} />
      </FieldGroup>
      <FieldGroup>
        <FieldLabel>السعر (ل.س)</FieldLabel>
        <Input
          className="max-w-xs"
          name="price"
          defaultValue={service?.price}
          placeholder="0.00"
        />
      </FieldGroup>
      <div>
        <h3 className="mb-1 text-sm font-semibold text-slate-900">الأوراق المطلوبة</h3>
        <p className="mb-3 text-sm text-slate-500">يُولَّد منها نموذج رفع الملفات للمواطن تلقائياً.</p>
        <ServiceDocRows
          initial={
            service?.documents
              .sort((a, b) => a.sortOrder - b.sortOrder)
              .map((d) => ({
                name: d.name,
                isRequired: d.isRequired,
                fileType: d.fileType as FileKind,
              }))
          }
        />
      </div>
      <Button type="submit" size="lg">
        {service ? "حفظ التعديلات" : "إنشاء الخدمة"}
      </Button>
    </form>
  );
}
