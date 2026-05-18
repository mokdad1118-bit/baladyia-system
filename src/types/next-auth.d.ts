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
      /** البلدية التابعة للحساب (null لمشرف المحافظة فقط) */
      municipalityId: string | null;
      /** لمشرف المحافظة: تصفية البيانات لبلدية واحدة، أو null لكل المحافظة */
      activeMunicipalityId: string | null;
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
    municipalityId?: string | null;
    activeMunicipalityId?: string | null;
    permManageServices?: boolean;
    permManageUsers?: boolean;
    permViewStats?: boolean;
  }
}
