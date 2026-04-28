import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { UserRole } from "@/generated/prisma/enums";

export default async function HomePage() {
  const s = await auth();

  if (!s?.user) redirect("/citizen/login");
  if (s.user.role === UserRole.CITIZEN) redirect("/citizen");
  if (s.user.role === UserRole.EMPLOYEE) redirect("/employee");
  redirect("/admin");
}
