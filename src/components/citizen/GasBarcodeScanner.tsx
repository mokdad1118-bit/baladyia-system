"use client";

import { useEffect, useRef, useState } from "react";
import { useActionState } from "react";
import { AsyncWaitOverlay } from "@/components/ui/AsyncWaitOverlay";
import type { SubmitGasRequestState } from "@/actions/gas-request";

type BarcodeDetectorLike = {
  detect(source: HTMLVideoElement): Promise<Array<{ rawValue: string }>>;
};

type BarcodeDetectorCtor = new (options?: { formats?: string[] }) => BarcodeDetectorLike;

export function GasBarcodeScanner({
  action,
  prefill,
}: {
  action: (prev: SubmitGasRequestState, formData: FormData) => Promise<SubmitGasRequestState>;
  prefill?: {
    name?: string | null;
    phone?: string | null;
    nationalId?: string | null;
  };
}) {
  const [state, formAction, pending] = useActionState(action, undefined);
  const [scanValue, setScanValue] = useState("");
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach((track) => track.stop());
    };
  }, []);

  async function startCamera() {
    setCameraError(null);

    const BarcodeDetector = (window as typeof window & { BarcodeDetector?: BarcodeDetectorCtor }).BarcodeDetector;
    if (!BarcodeDetector) {
      setCameraError("المتصفح لا يدعم قراءة الباركود بالكاميرا. أدخل الرمز المكتوب أسفل باركود المعتمد.");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" } },
        audio: false,
      });
      streamRef.current = stream;
      setCameraActive(true);

      const video = videoRef.current;
      if (!video) return;
      video.srcObject = stream;
      await video.play();

      const detector = new BarcodeDetector({ formats: ["code_128", "qr_code"] });
      let stopped = false;

      const scan = async () => {
        if (stopped || !streamRef.current || !videoRef.current) return;
        try {
          const codes = await detector.detect(videoRef.current);
          const value = codes[0]?.rawValue?.trim();
          if (value) {
            setScanValue(value);
            streamRef.current.getTracks().forEach((track) => track.stop());
            streamRef.current = null;
            setCameraActive(false);
            stopped = true;
            return;
          }
        } catch {
          setCameraError("تعذر قراءة الباركود. قرّب الكاميرا من الرمز أو أدخله يدوياً.");
        }
        window.setTimeout(scan, 300);
      };

      void scan();
    } catch {
      setCameraError("تعذر تشغيل الكاميرا. تأكد من السماح للتطبيق باستخدام الكاميرا.");
    }
  }

  function stopCamera() {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    setCameraActive(false);
  }

  return (
    <>
      <AsyncWaitOverlay active={pending} variant="gov" />
      <div className="space-y-4">
        {state?.error ? (
          <p className="rounded-xl border border-[var(--gov-flag-red)]/40 bg-[var(--gov-flag-red)]/5 px-3 py-2 text-sm">
            {state.error}
          </p>
        ) : null}

        <div className="overflow-hidden rounded-xl border border-[var(--gov-border)] bg-slate-950">
          <video ref={videoRef} className="aspect-[4/3] w-full object-cover" muted playsInline />
        </div>

        {cameraError ? (
          <p className="rounded-xl border border-amber-300/70 bg-amber-50 px-3 py-2 text-sm text-amber-900">
            {cameraError}
          </p>
        ) : null}

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={startCamera}
            disabled={cameraActive}
            className="gov-btn-primary px-4 py-2.5 text-sm font-semibold disabled:opacity-60"
          >
            {cameraActive ? "جاري المسح..." : "فتح الكاميرا ومسح الباركود"}
          </button>
          {cameraActive ? (
            <button
              type="button"
              onClick={stopCamera}
              className="rounded-sm border border-[var(--gov-border)] bg-white px-4 py-2.5 text-sm font-semibold text-[var(--gov-primary)]"
            >
              إيقاف الكاميرا
            </button>
          ) : null}
        </div>

        <form action={formAction} className="space-y-4">
          <input type="hidden" name="fullName" value={prefill?.name ?? ""} />
          <input type="hidden" name="phone" value={prefill?.phone ?? ""} />
          <input type="hidden" name="nationalId" value={prefill?.nationalId ?? ""} />

          <div>
            <label className="mb-1.5 block text-sm font-medium text-[var(--gov-text)]">رمز معتمد الغاز</label>
            <input
              name="gasAgentToken"
              required
              dir="ltr"
              value={scanValue}
              onChange={(e) => setScanValue(e.target.value)}
              placeholder="gas-agent:..."
              className="gov-input w-full px-3 py-2.5 text-sm"
            />
          </div>

          <div className="rounded-xl border border-[var(--gov-border)] bg-slate-50 px-3 py-2 text-sm text-[var(--gov-muted)]">
            سيتم تسجيل استلام جرة الغاز باسم {prefill?.name ?? "المواطن"} وإرسال السجل إلى لوحة الإدارة ولوحة المعتمد.
          </div>

          <button
            type="submit"
            disabled={pending || !scanValue.trim()}
            className="gov-btn-primary w-full px-4 py-3 text-sm font-semibold disabled:opacity-60"
          >
            {pending ? "جاري التسجيل..." : "تسجيل استلام جرة الغاز"}
          </button>
        </form>
      </div>
    </>
  );
}

