import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { UserRole } from "@/generated/prisma/enums";

/** `auth()` يعتمد على الجلسة/headers — لا يُجمَّد كصفحة ثابتة */
export const dynamic = "force-dynamic";

export default async function HomePage() {
  const s = await auth();

  if (!s?.user) redirect("/citizen/login?next=/");
  if (s.user.role === UserRole.CITIZEN) redirect("/citizen");
  if (s.user.role === UserRole.EMPLOYEE) redirect("/staff");
  redirect("/admin");
}
