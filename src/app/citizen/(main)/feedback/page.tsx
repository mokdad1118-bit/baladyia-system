import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { UserRole } from "@/generated/prisma/enums";
import { submitCitizenFeedback } from "@/actions/citizen-feedback";
import { CitizenFeedbackForm } from "@/components/citizen/CitizenFeedbackForm";

export default async function CitizenFeedbackPage() {
  const s = await auth();
  if (!s?.user || s.user.role !== UserRole.CITIZEN) {
    redirect("/citizen/welcome?next=/citizen/feedback");
  }

  return (
    <div className="px-3 md:px-0">
      <header className="gov-page-heading mb-4 border-b border-[var(--gov-border)] pb-4">
        <h1 className="text-lg font-bold text-[var(--gov-text)] md:text-xl">الشكاوي والمقترحات</h1>
        <p className="mt-1 text-sm text-[var(--gov-muted)]">
          اكتب شكواك أو اقتراحك بخصوص التطبيق. سيتم إرسالها مباشرة إلى لوحة تحكم الأدمن.
        </p>
      </header>

      <CitizenFeedbackForm action={submitCitizenFeedback} />
    </div>
  );
}
