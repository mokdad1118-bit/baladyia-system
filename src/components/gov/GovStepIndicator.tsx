import { cn } from "@/lib/cn";

const FLOW = [
  { step: 1 as const, label: "اختيار الخدمة" },
  { step: 2 as const, label: "تعبئة البيانات" },
  { step: 3 as const, label: "رفع الملفات" },
  { step: 4 as const, label: "المراجعة والإرسال" },
] as const;

export type CitizenFlowStep = (typeof FLOW)[number]["step"];

type Density = "default" | "compact";

/** مؤشر خطوات بصري بسيط — بدون حركات أو تأثيرات */
export function GovStepIndicator({
  currentStep,
  density = "default",
}: {
  currentStep: CitizenFlowStep;
  density?: Density;
}) {
  if (density === "compact") {
    return (
      <ol
        className="gov-step-indicator mb-3 flex snap-x snap-mandatory gap-1.5 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] md:mb-6 md:grid md:grid-cols-4 md:gap-2 md:overflow-visible md:pb-0 [&::-webkit-scrollbar]:hidden"
        aria-label="مراحل الطلب"
      >
        {FLOW.map((s) => {
          const done = currentStep > s.step;
          const active = currentStep === s.step;
          return (
            <li
              key={s.step}
              className={cn(
                "gov-step-indicator__item max-md:min-w-[5.5rem] shrink-0 snap-start border px-2 py-1.5 text-center text-[0.65rem] leading-tight sm:text-xs md:px-2 md:py-2 md:text-sm",
                done && "gov-step-indicator__item--done",
                active && "gov-step-indicator__item--active",
                !done && !active && "gov-step-indicator__item--idle",
              )}
            >
              <span className="tabular-nums font-semibold max-md:inline md:block">{s.step}</span>
              <span className="max-md:ms-0.5 max-md:inline max-md:font-medium md:block md:font-medium">{s.label}</span>
            </li>
          );
        })}
      </ol>
    );
  }

  return (
    <ol
      className="gov-step-indicator mb-6 grid grid-cols-1 gap-2 min-[380px]:grid-cols-2 sm:grid-cols-4"
      aria-label="مراحل الطلب"
    >
      {FLOW.map((s) => {
        const done = currentStep > s.step;
        const active = currentStep === s.step;
        return (
          <li
            key={s.step}
            className={cn(
              "gov-step-indicator__item border px-2 py-2 text-center text-xs leading-snug sm:text-sm",
              done && "gov-step-indicator__item--done",
              active && "gov-step-indicator__item--active",
              !done && !active && "gov-step-indicator__item--idle",
            )}
          >
            <span className="tabular-nums font-semibold">{s.step}</span>
            <span className="block font-medium">{s.label}</span>
          </li>
        );
      })}
    </ol>
  );
}
