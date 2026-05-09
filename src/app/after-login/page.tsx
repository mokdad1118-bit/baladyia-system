import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { homeForRole } from "@/lib/home-nav";

export default async function AfterLoginPage() {
  const s = await auth();
  if (!s?.user) redirect("/citizen/welcome");
  redirect(homeForRole(s.user.role));
}
