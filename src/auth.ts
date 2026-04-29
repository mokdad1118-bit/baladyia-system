import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { UserRole } from "@/generated/prisma/enums";
import { db } from "@/lib/db";
import { digitsOnly, notifEmailOrNull } from "@/lib/phone";
import { verifyPassword } from "@/lib/password";
import type { AuthPortal } from "@/lib/auth-portal";

/** فصل البوابات: لا يُقبل موظف عبر portal=citizen ولا مواطن عبر portal=staff */
function portalAllowsRole(portal: AuthPortal, role: UserRole) {
  if (portal === "citizen") return role === UserRole.CITIZEN;
  if (portal === "staff") return role === UserRole.EMPLOYEE || role === UserRole.ADMIN;
  return false;
}

/** أشكال شائعة لنفس الرقم (محلي 09… مقابل 963…) لتفادي «الحساب غير موجود» بعد التسجيل */
function citizenPhoneLookupKeys(digits: string): string[] {
  const keys = new Set<string>();
  if (!digits) return [];
  keys.add(digits);
  if (digits.startsWith("963") && digits.length >= 11) {
    keys.add(`0${digits.slice(3)}`);
  }
  if (digits.startsWith("0") && digits.length >= 10) {
    keys.add(`963${digits.slice(1)}`);
  }
  if (/^9\d{8,9}$/.test(digits)) {
    keys.add(`963${digits}`);
  }
  return [...keys];
}

async function findUserForCitizenCredentials(identifier: string) {
  const id = identifier.trim();
  if (!id) return null;
  if (id.includes("@")) {
    const email = id.toLowerCase();
    const user = await db.user.findUnique({ where: { email } });
    if (user) return user;
    const notif = notifEmailOrNull(id);
    if (!notif) return null;
    return db.user.findFirst({
      where: { notificationEmail: notif, role: UserRole.CITIZEN },
    });
  }
  const d = digitsOnly(id);
  for (const phone of citizenPhoneLookupKeys(d)) {
    const u = await db.user.findUnique({ where: { phone } });
    if (u) return u;
  }
  return null;
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  secret: process.env.AUTH_SECRET,
  trustHost: true,
  /** على http:// (مثل الموبايل على LAN) يجب ألا تُعلَّم الكوكيز Secure — وإلا لا تُحفظ الجلسة */
  useSecureCookies: process.env.NODE_ENV === "production",
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        identifier: { label: "بريد أو واتساب", type: "text" },
        password: { label: "password", type: "password" },
        portal: { label: "portal", type: "text" },
      },
      async authorize(credentials) {
        if (!credentials?.identifier || !credentials?.password) return null;
        const portalRaw = String(credentials.portal ?? "").trim() as AuthPortal;
        if (portalRaw !== "citizen" && portalRaw !== "staff") {
          return null;
        }
        const id = String(credentials.identifier).trim();
        if (!id) return null;
        const user =
          portalRaw === "citizen"
            ? await findUserForCitizenCredentials(id)
            : id.includes("@")
              ? await db.user.findUnique({
                  where: { email: id.toLowerCase() },
                })
              : await db.user.findUnique({
                  where: { phone: digitsOnly(id) },
                });
        if (!user || !user.isActive) return null;
        if (!portalAllowsRole(portalRaw, user.role)) return null;
        const ok = await verifyPassword(
          String(credentials.password),
          user.passwordHash,
        );
        if (!ok) return null;
        const isAdminRole = user.role === UserRole.ADMIN;
        return {
          id: user.id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          role: user.role,
          permManageServices: isAdminRole || user.permManageServices,
          permManageUsers: isAdminRole || user.permManageUsers,
          permViewStats: isAdminRole || user.permViewStats,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        const u = user as {
          id: string;
          role: UserRole;
          email?: string | null;
          phone?: string | null;
          permManageServices?: boolean;
          permManageUsers?: boolean;
          permViewStats?: boolean;
        };
        token.id = u.id;
        token.role = u.role;
        token.email = u.email;
        token.phone = u.phone;
        token.permManageServices = Boolean(u.permManageServices);
        token.permManageUsers = Boolean(u.permManageUsers);
        token.permViewStats = Boolean(u.permViewStats);
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as UserRole;
        session.user.email = (token.email as string | null | undefined) ?? "";
        session.user.phone = (token.phone as string | null | undefined) ?? "";
        session.user.permManageServices = Boolean(token.permManageServices);
        session.user.permManageUsers = Boolean(token.permManageUsers);
        session.user.permViewStats = Boolean(token.permViewStats);
      }
      return session;
    },
  },
});
