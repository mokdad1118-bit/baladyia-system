import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { UserRole } from "@/generated/prisma/enums";
import { db } from "@/lib/db";
import {
  citizenPhoneLookupKeys,
  digitsOnly,
  normalizeCitizenPhoneForStorage,
  notifEmailOrNull,
} from "@/lib/phone";
import { verifyPassword } from "@/lib/password";
import type { LoginPageSurface } from "@/lib/auth-portal";
import { getAuthSecret } from "@/lib/auth-secret";

function loginPageAllowsRole(surface: LoginPageSurface, role: UserRole) {
  if (surface === "citizen") return role === UserRole.CITIZEN;
  if (surface === "staff") return role === UserRole.EMPLOYEE;
  if (surface === "admin") return role === UserRole.ADMIN;
  return false;
}

/** بحث موحّد بالبريد أو الهاتف أو بريد الإشعارات — للموظفين والمدير فقط */
async function findStaffUserByIdentifier(identifier: string) {
  const id = identifier.trim();
  if (!id) return null;
  if (id.includes("@")) {
    const email = id.toLowerCase();
    const byEmail = await db.user.findUnique({ where: { email } });
    if (byEmail) return byEmail;
    const notif = notifEmailOrNull(id);
    if (!notif) return null;
    return db.user.findFirst({ where: { notificationEmail: notif } });
  }
  const d = digitsOnly(id);
  if (!d) return null;
  const canonical = normalizeCitizenPhoneForStorage(id);
  const variants = new Set([
    ...citizenPhoneLookupKeys(d),
    ...citizenPhoneLookupKeys(canonical),
    canonical,
  ]);
  for (const phone of variants) {
    if (!phone) continue;
    const u = await db.user.findUnique({ where: { phone } });
    if (u) return u;
  }
  return null;
}

/** دخول المواطن: رقم الهاتف فقط (بعد التطبيع) */
async function findCitizenUserByPhone(identifier: string) {
  const id = identifier.trim();
  if (!id || id.includes("@")) return null;
  const d = digitsOnly(id);
  if (!d) return null;
  const canonical = normalizeCitizenPhoneForStorage(id);
  const variants = new Set([
    ...citizenPhoneLookupKeys(d),
    ...citizenPhoneLookupKeys(canonical),
    canonical,
  ]);
  for (const phone of variants) {
    if (!phone) continue;
    const u = await db.user.findUnique({ where: { phone } });
    if (u) return u;
  }
  return null;
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  secret: getAuthSecret(),
  trustHost: true,
  useSecureCookies: process.env.NODE_ENV === "production",
  session: { strategy: "jwt" },
  pages: { signIn: "/citizen/login" },
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        identifier: { label: "بريد أو واتساب", type: "text" },
        password: { label: "password", type: "password" },
        loginPage: { label: "loginPage", type: "text" },
      },
      async authorize(credentials) {
        if (!credentials?.identifier || !credentials?.password) return null;
        const surface = String(credentials.loginPage ?? "").trim() as LoginPageSurface;
        if (surface !== "citizen" && surface !== "staff" && surface !== "admin") {
          return null;
        }
        const id = String(credentials.identifier).trim();
        if (!id) return null;
        const user =
          surface === "citizen" ? await findCitizenUserByPhone(id) : await findStaffUserByIdentifier(id);
        if (!user || !user.isActive) return null;
        if (!loginPageAllowsRole(surface, user.role)) return null;
        if (surface === "citizen" && user.role === UserRole.CITIZEN && !user.isVerified) {
          return null;
        }
        const ok = await verifyPassword(String(credentials.password), user.passwordHash);
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
