"use client";

import { useState } from "react";
import { BRAND_ASSETS } from "@/lib/entity";

const SRC_PNG = BRAND_ASSETS.stateEmblemPng;
const SRC_SVG = BRAND_ASSETS.stateEmblemSvg;

/**
 * عرض الشعار الرسمي من الملفات الموجودة في public/brand دون أي فلترة أو تشويه.
 * حالياً نُبقي صورة الهوية البصرية كما هي، ويمكن لاحقاً إضافة شعار محافظة درعا
 * عبر BRAND_ASSETS.governorateEmblemPng دون كسر الواجهات.
 */
export function StateEmblem({
  className,
  height = 64,
}: {
  className?: string;
  /** ارتفاع بالبكسل — العرض يتبع نسبة الشعار */
  height?: number;
}) {
  const [src, setSrc] = useState<string>(SRC_PNG);
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <div
        className={`flex items-center justify-center border border-dashed border-white/40 bg-white/5 text-center text-[0.65rem] leading-snug text-white/90 ${className ?? ""}`}
        style={{ width: height * 0.85, height }}
        role="img"
        aria-label="شعار الجمهورية العربية السورية"
      >
        شعار الدولة
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element -- ملف رسمي خارجي؛ لا نستخدم تحسين Next حتى لا يُعاد تصدير الشعار
    <img
      src={src}
      alt="شعار الجمهورية العربية السورية"
      width={Math.round(height * 0.75)}
      height={height}
      className={`object-contain object-center ${className ?? ""}`}
      style={{ maxHeight: height }}
      onError={() => {
        if (src === SRC_PNG) setSrc(SRC_SVG);
        else setFailed(true);
      }}
    />
  );
}
