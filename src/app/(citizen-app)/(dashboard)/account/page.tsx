import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { UserRole } from "@/generated/prisma/enums";
import { CitizenAccountView } from "@/components/citizen/CitizenAccountView";

export default async function CitizenAccountPage() {
  const s = await auth();
  if (!s?.user || s.user.role !== UserRole.CITIZEN) {
    redirect("/citizen/login?next=/account");
  }

  const me = await db.user.findUnique({
    where: { id: s.user.id },
    select: {
      name: true,
      email: true,
      phone: true,
      nationalId: true,
      notificationEmail: true,
      createdAt: true,
    },
  });
  if (!me) redirect("/citizen");

  return (
    <div className="w-full min-w-0 max-w-full">
      <CitizenAccountView
        user={{
          name: me.name,
          email: me.email,
          phone: me.phone,
          nationalId: me.nationalId,
          notificationEmail: me.notificationEmail,
          createdAt: me.createdAt.toISOString(),
        }}
      />
    </div>
  );
}
