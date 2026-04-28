import { auth } from "@/auth";
import { UserBar } from "./UserBar";
import { GuestBar } from "./GuestBar";
import { db } from "@/lib/db";

export async function MainNav() {
  const s = await auth();
  if (!s?.user) {
    return <GuestBar />;
  }
  const unread = await db.notification.count({
    where: { userId: s.user.id, read: false },
  });
  return (
    <UserBar
      name={s.user.name ?? "—"}
      email={s.user.email ?? ""}
      phone={s.user.phone ?? ""}
      role={s.user.role}
      unread={unread}
    />
  );
}
