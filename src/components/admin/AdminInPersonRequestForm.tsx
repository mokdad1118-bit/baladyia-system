"use client";

import { useActionState, useEffect } from "react";
import type { Service, ServiceDocument } from "@/generated/prisma/client";
import { createInPersonRequestAction } from "@/actions/admin-in-person-requests";
import { fileKindAr } from "@/lib/labels";
import { acceptForKind } from "@/lib/file-accept";
import { maxCitizenAttachmentLabelAr } from "@/lib/upload-limits";
import { navigateTopLevel } from "@/lib/navigate-client";

export function AdminInPersonRequestForm({
  service,
  errorMessage,
}: {
  service: Service & { documents: ServiceDocument[]; municipality: { name: string } };
  errorMessage?: string;
}) {
  const documents = service.documents.slice().sort((a, b) => a.sortOrder - b.sortOrder);
  const [state, action, isPending] = useActionState(createInPersonRequestAction, undefined);

  useEffect(() => {
    if (!state?.ok) return;
    const timer = window.setTimeout(() => {
      navigateTopLevel(state.redirectTo);
    }, 900);
    return () => window.clearTimeout(timer);
  }, [state]);

  return (
    <form action={action} encType="multipart/form-data" className="gov-card space-y-5 p-4 md:p-6">
      <input type="hidden" name="serviceId" value={service.id} />

      <header className="border-b border-[var(--gov-border)] pb-4">
        <h2 className="text-base font-bold text-[var(--gov-text)]">إنشاء طلب حضوري</h2>
        <p className="mt-1 text-sm text-[var(--gov-muted)]">
          {service.name} - {service.municipality.name}
        </p>
        <p className="mt-1 text-xs text-[var(--gov-muted)]">
          تستخدم هذه الصفحة نفس إعدادات الخدمة والأوراق المطلوبة في طلبات المواطن.
        </p>
      </header>

      {isPending ? (
        <p
          className="rounded-sm border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900"
          role="status"
          aria-live="polite"
        >
          يرجى الانتظار، جاري حفظ الطلب...
        </p>
      ) : null}

      {!isPending && state?.ok ? (
        <p
          className="rounded-sm border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800"
          role="status"
          aria-live="polite"
        >
          تم حفظ الطلب.
        </p>
      ) : null}

      {!isPending && state && !state.ok ? (
        <p className="rounded-sm border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800">{state.error}</p>
      ) : null}

      {!isPending && !state && errorMessage ? (
        <p className="rounded-sm border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800">{errorMessage}</p>
      ) : null}

      <section className="grid gap-3 md:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-[var(--gov-text)]">اسم المواطن *</label>
          <input name="fullName" required minLength={2} className="gov-input w-full px-3 py-2.5 text-sm" />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-[var(--gov-text)]">الرقم الوطني *</label>
          <input name="nationalId" required inputMode="numeric" dir="ltr" className="gov-input w-full px-3 py-2.5 text-sm" />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-[var(--gov-text)]">رقم الواتساب *</label>
          <input name="phone" required inputMode="numeric" dir="ltr" className="gov-input w-full px-3 py-2.5 text-sm" />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-[var(--gov-text)]">بريد إشعارات لاحقة</label>
          <input name="notificationEmail" type="email" dir="ltr" className="gov-input w-full px-3 py-2.5 text-sm" />
        </div>
      </section>

      <section className="space-y-3">
        <h3 className="border-b border-[var(--gov-border)] pb-2 text-sm font-bold text-[var(--gov-text)]">
          الأوراق والمرفقات المطلوبة
        </h3>
        {documents.length === 0 ? (
          <p className="rounded-sm border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
            لا توجد مستندات معرفة لهذه الخدمة.
          </p>
        ) : (
          documents.map((doc) => (
            <div key={doc.id} className="border border-[var(--gov-border)] bg-slate-50 p-3">
              <div className="mb-2 flex flex-wrap items-baseline justify-between gap-2">
                <label className="text-sm font-semibold text-[var(--gov-text)]">
                  {doc.name}
                  {doc.isRequired ? <span className="ms-1 text-rose-700">*</span> : null}
                </label>
                <span className="text-xs text-[var(--gov-muted)]">{fileKindAr[doc.fileType]}</span>
              </div>
              <input
                name={`file_${doc.id}`}
                type="file"
                required={doc.isRequired}
                accept={acceptForKind(doc.fileType)}
                className="gov-file-input block w-full cursor-pointer text-sm"
              />
              <p className="mt-1.5 text-xs text-[var(--gov-muted)]">
                الحد الأقصى لحجم الملف: {maxCitizenAttachmentLabelAr()} لكل مرفق.
              </p>
            </div>
          ))
        )}
      </section>

      <div className="border-t border-[var(--gov-border)] pt-4">
        <button
          type="submit"
          disabled={isPending || Boolean(state?.ok)}
          className="gov-btn-primary px-5 py-2.5 text-sm font-semibold disabled:opacity-60"
        >
          {isPending ? "جاري الحفظ..." : "حفظ الطلب الحضوري"}
        </button>
      </div>
    </form>
  );
}
