import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { UserRole } from "@/generated/prisma/enums";
import { db } from "@/lib/db";
import { submitCitizenFeedback } from "@/actions/citizen-feedback";
import { CitizenFeedbackForm } from "@/components/citizen/CitizenFeedbackForm";
import { CitizenFeedbackList } from "@/components/citizen/CitizenFeedbackList";

export default async function CitizenFeedbackPage() {
  const s = await auth();
  if (!s?.user || s.user.role !== UserRole.CITIZEN) {
    redirect("/citizen/welcome?next=/citizen/feedback");
  }

  const previous = await db.citizenFeedback.findMany({
    where: { citizenId: s.user.id },
    orderBy: { createdAt: "desc" },
    take: 100,
    select: {
      id: true,
      message: true,
      createdAt: true,
      adminReply: true,
      adminReplyAt: true,
    },
  });

  return (
    <div className="px-3 md:px-0">
      <header className="gov-page-heading mb-4 border-b border-[var(--gov-border)] pb-4">
        <h1 className="text-lg font-bold text-[var(--gov-text)] md:text-xl">الشكاوي والمقترحات</h1>
        <p className="mt-1 text-sm text-[var(--gov-muted)]">
          اكتب شكواك أو اقتراحك بخصوص التطبيق. سيتم ارسالها مباشرة الى الادارة، ويظهر رد الإدارة هنا وفي الإشعارات.
        </p>
      </header>

      <CitizenFeedbackList items={previous} />

      <h2 className="mb-3 text-sm font-bold text-[var(--gov-text)]">إرسال شكوى أو مقترح جديد</h2>
      <CitizenFeedbackForm action={submitCitizenFeedback} />
    </div>
  );
}
