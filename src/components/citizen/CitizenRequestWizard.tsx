"use client";

import { useActionState, useId, useRef, useState } from "react";
import { fileKindAr } from "@/lib/labels";
import { acceptForKind } from "@/lib/file-accept";
import { submitRequest } from "@/actions/request-citizen";
import type { Service, ServiceDocument } from "@/generated/prisma/client";
import { Button } from "@/components/ui/button";
import { AsyncWaitOverlay } from "@/components/ui/AsyncWaitOverlay";
import { FieldLabel, Input } from "@/components/ui/field";
import { cn } from "@/lib/cn";
import { GovStepIndicator, type CitizenFlowStep } from "@/components/gov/GovStepIndicator";
import { MAX_CITIZEN_ATTACHMENT_BYTES, maxCitizenAttachmentLabelAr } from "@/lib/upload-limits";

type Prefill = { name: string; phone: string | null; notificationEmail: string | null };

type ReviewSnapshot = {
  name: string;
  phone: string;
  email: string;
  fileLines: { label: string; fileName: string }[];
};

export function CitizenRequestWizard({
  service,
  prefill,
}: {
  service: Service & { documents: ServiceDocument[] };
  prefill: Prefill | null;
}) {
  const [st, act, isPending] = useActionState(submitRequest, undefined);
  const formRef = useRef<HTMLFormElement>(null);
  const [uiStep, setUiStep] = useState<2 | 3 | 4>(2);
  const [reviewSnapshot, setReviewSnapshot] = useState<ReviewSnapshot | null>(null);
  const [attachmentStepError, setAttachmentStepError] = useState<string | null>(null);
  const currentStep: CitizenFlowStep = uiStep;

  const list = service.documents.slice().sort((a, b) => a.sortOrder - b.sortOrder);

  function validateAttachmentSizes(docs: ServiceDocument[]): string | null {
    const root = formRef.current;
    if (!root) return null;
    for (const d of docs) {
      const el = root.elements.namedItem(`file_${d.id}`);
      if (!(el instanceof HTMLInputElement)) continue;
      const f = el.files?.[0];
      if (f && f.size > MAX_CITIZEN_ATTACHMENT_BYTES) {
        return `الملف «${f.name}» (${d.name}) يتجاوز الحد المسموح (${maxCitizenAttachmentLabelAr()} لكل ملف). اختر ملفاً أصغر أو اضغط الصورة.`;
      }
    }
    return null;
  }

  function validateStep(step: 2 | 3): boolean {
    const root = formRef.current;
    if (!root) return false;
    const scope = root.querySelector(`[data-wizard-step="${step}"]`);
    if (!scope || !(scope instanceof HTMLElement)) return false;
    const controls = scope.querySelectorAll("input,select,textarea");
    for (const el of controls) {
      if (el instanceof HTMLInputElement || el instanceof HTMLSelectElement || el instanceof HTMLTextAreaElement) {
        if (!el.checkValidity()) {
          el.reportValidity();
          return false;
        }
      }
    }
    return true;
  }

  function captureReviewSnapshot(docs: ServiceDocument[]): ReviewSnapshot | null {
    const root = formRef.current;
    if (!root) return null;
    const fullName = root.elements.namedItem("fullName");
    const phone = root.elements.namedItem("phone");
    const email = root.elements.namedItem("notificationEmail");
    const nameVal = fullName instanceof HTMLInputElement ? fullName.value : "";
    const phoneVal = phone instanceof HTMLInputElement ? phone.value : "";
    const emailVal = email instanceof HTMLInputElement ? email.value : "";
    const fileLines = docs.map((d) => {
      const el = root.elements.namedItem(`file_${d.id}`);
      const f = el instanceof HTMLInputElement ? el.files?.[0] : undefined;
      return { label: d.name, fileName: f?.name ?? "— لم يُرفع" };
    });
    return { name: nameVal, phone: phoneVal, email: emailVal, fileLines };
  }

  return (
    <form ref={formRef} className="space-y-5" action={act}>
      <AsyncWaitOverlay active={isPending} variant="emerald" />
      <GovStepIndicator currentStep={currentStep} />

      {st?.error && (
        <p className="border border-[var(--gov-flag-red)]/35 bg-[var(--gov-flag-red)]/5 px-3 py-2 text-sm text-[var(--gov-text)]">
          {st.error}
        </p>
      )}

      <input type="hidden" name="serviceId" value={service.id} />

      <div data-wizard-step="2" hidden={uiStep !== 2} className="space-y-4 border border-[var(--gov-border)] bg-white p-4">
        <p className="border-b border-[var(--gov-border)] pb-2 text-sm font-semibold text-[var(--gov-text)]">بيانات الاتصال (تُرسل مع الطلب)</p>
        <div className="space-y-3">
          <div>
            <FieldLabel>الاسم الثلاثي *</FieldLabel>
            <Input
              name="fullName"
              type="text"
              required
              minLength={2}
              defaultValue={prefill?.name ?? ""}
              autoComplete="name"
            />
          </div>
          <div>
            <FieldLabel>رقم واتساب * (أرقام فقط)</FieldLabel>
            <Input
              name="phone"
              type="tel"
              required
              inputMode="numeric"
              defaultValue={prefill?.phone ?? ""}
              autoComplete="tel"
              dir="ltr"
            />
          </div>
          <div>
            <FieldLabel>بريد إشعارات لاحقة (اختياري)</FieldLabel>
            <Input
              name="notificationEmail"
              type="email"
              defaultValue={prefill?.notificationEmail ?? ""}
              autoComplete="email"
            />
            <p className="mt-1 text-xs text-[var(--gov-muted)]">يُسجَّل في ملفك عند الإرسال.</p>
          </div>
        </div>
        <div className="flex flex-col gap-2 border-t border-[var(--gov-border)] pt-4 sm:flex-row sm:flex-wrap sm:justify-end">
          <button
            type="button"
            className="gov-btn-primary min-h-11 w-full px-5 py-2.5 text-sm font-semibold sm:w-auto"
            onClick={() => {
              if (!validateStep(2)) return;
              setAttachmentStepError(null);
              setUiStep(3);
            }}
          >
            التالي: المرفقات
          </button>
        </div>
      </div>

      <div data-wizard-step="3" hidden={uiStep !== 3} className="space-y-4">
        {attachmentStepError && (
          <p className="border border-[var(--gov-flag-red)]/35 bg-[var(--gov-flag-red)]/5 px-3 py-2 text-sm text-[var(--gov-text)]">
            {attachmentStepError}
          </p>
        )}
        {list.map((d) => (
          <FileField key={d.id} doc={d} />
        ))}
        <div className="flex flex-col-reverse gap-2 border-t border-[var(--gov-border)] pt-4 sm:flex-row sm:flex-wrap sm:justify-between">
          <button
            type="button"
            className="gov-btn-secondary min-h-11 w-full px-5 py-2.5 text-sm font-semibold sm:w-auto"
            onClick={() => {
              setAttachmentStepError(null);
              setUiStep(2);
            }}
          >
            السابق
          </button>
          <button
            type="button"
            className="gov-btn-primary min-h-11 w-full px-5 py-2.5 text-sm font-semibold sm:w-auto"
            onClick={() => {
              setAttachmentStepError(null);
              if (!validateStep(3)) return;
              const sizeErr = validateAttachmentSizes(list);
              if (sizeErr) {
                setAttachmentStepError(sizeErr);
                return;
              }
              const snap = captureReviewSnapshot(list);
              if (!snap) return;
              setReviewSnapshot(snap);
              setUiStep(4);
            }}
          >
            التالي: المراجعة
          </button>
        </div>
      </div>

      {uiStep === 4 && reviewSnapshot && (
        <div className="space-y-4 border border-[var(--gov-border)] bg-white p-4">
          <p className="border-b border-[var(--gov-border)] pb-2 text-sm font-semibold text-[var(--gov-text)]">ملخص قبل الإرسال</p>
          <ReviewBlock serviceName={service.name} review={reviewSnapshot} />
          <div className="flex flex-col-reverse gap-2 border-t border-[var(--gov-border)] pt-4 sm:flex-row sm:flex-wrap sm:justify-between">
            <button
              type="button"
              className="gov-btn-secondary min-h-11 w-full px-5 py-2.5 text-sm font-semibold sm:w-auto"
              onClick={() => {
                setAttachmentStepError(null);
                setUiStep(3);
              }}
            >
              السابق
            </button>
            <Button
              className="gov-btn-primary min-h-11 w-full rounded-sm border-0 bg-[var(--gov-primary)] px-6 text-sm font-semibold sm:w-auto sm:min-h-10"
              type="submit"
              size="lg"
              disabled={isPending}
            >
              {isPending ? "يرجى الانتظار…" : "إرسال الطلب"}
            </Button>
          </div>
        </div>
      )}
    </form>
  );
}

function FileField({ doc: d }: { doc: ServiceDocument }) {
  const id = useId();
  return (
    <div
      className={cn(
        "border border-[var(--gov-border)] bg-[#f7f8fa] p-4 focus-within:ring-1 focus-within:ring-[var(--gov-primary)]",
      )}
    >
      <div className="mb-2 flex flex-wrap items-baseline justify-between gap-2">
        <FieldLabel className="!mb-0 text-base text-[var(--gov-text)]">
          {d.name}
          {d.isRequired && <span className="ms-0.5 text-[var(--gov-flag-red)]">*</span>}
        </FieldLabel>
        <span className="text-xs text-[var(--gov-muted)]">نوع الملف: {fileKindAr[d.fileType]}</span>
      </div>
      <input
        id={id}
        className="gov-file-input block w-full cursor-pointer text-sm"
        name={`file_${d.id}`}
        type="file"
        required={d.isRequired}
        accept={acceptForKind(d.fileType)}
      />
      <p className="mt-1.5 text-xs text-[var(--gov-muted)]">
        الحد الأقصى لحجم الملف: {maxCitizenAttachmentLabelAr()} لكل مرفق.
      </p>
    </div>
  );
}

function ReviewBlock({ serviceName, review }: { serviceName: string; review: ReviewSnapshot }) {
  return (
    <dl className="space-y-2 text-sm">
      <div className="flex flex-wrap gap-x-2 border-b border-[var(--gov-border)] py-1">
        <dt className="font-semibold text-[var(--gov-muted)]">الخدمة</dt>
        <dd className="text-[var(--gov-text)]">{serviceName}</dd>
      </div>
      <div className="flex flex-wrap gap-x-2 border-b border-[var(--gov-border)] py-1">
        <dt className="font-semibold text-[var(--gov-muted)]">الاسم</dt>
        <dd className="text-[var(--gov-text)]">{review.name || "—"}</dd>
      </div>
      <div className="flex flex-wrap gap-x-2 border-b border-[var(--gov-border)] py-1">
        <dt className="font-semibold text-[var(--gov-muted)]">واتساب</dt>
        <dd className="font-mono text-[var(--gov-text)]" dir="ltr">
          {review.phone || "—"}
        </dd>
      </div>
      <div className="flex flex-wrap gap-x-2 border-b border-[var(--gov-border)] py-1">
        <dt className="font-semibold text-[var(--gov-muted)]">البريد</dt>
        <dd className="text-[var(--gov-text)]">{review.email || "—"}</dd>
      </div>
      <div className="pt-1">
        <dt className="mb-1 font-semibold text-[var(--gov-muted)]">المرفقات</dt>
        <dd>
          <ul className="list-inside list-disc space-y-0.5 text-[var(--gov-text)]">
            {review.fileLines.map((x, i) => (
              <li key={`${x.label}-${i}`}>
                {x.label}: <span className="font-medium">{x.fileName}</span>
              </li>
            ))}
          </ul>
        </dd>
      </div>
    </dl>
  );
}
