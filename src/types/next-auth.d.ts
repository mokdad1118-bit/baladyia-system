import type { DefaultSession } from "next-auth";
import type { UserRole } from "@/generated/prisma/enums";

declare module "next-auth" {
  interface Session {
    user: DefaultSession["user"] & {
      id: string;
      role: UserRole;
      /** بريد الدخول أو "" للمواطن بلا بريد */
      email: string;
      phone: string;
      /** للموظف في لوحة الإدارة؛ المدير يُملأ دائماً بـ true من الخادم */
      permManageServices?: boolean;
      permManageUsers?: boolean;
      permViewStats?: boolean;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: UserRole;
    email?: string | null;
    phone?: string | null;
    permManageServices?: boolean;
    permManageUsers?: boolean;
    permViewStats?: boolean;
  }
}
