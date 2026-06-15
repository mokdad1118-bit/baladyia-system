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
import { isAdminPanelRole } from "@/lib/roles";
import { writeOperationLog } from "@/lib/operation-log";

function loginPageAllowsRole(surface: LoginPageSurface, role: UserRole) {
  if (surface === "citizen") return role === UserRole.CITIZEN || role === UserRole.GAS_AGENT;
  if (surface === "staff") return role === UserRole.EMPLOYEE;
  if (surface === "admin") return isAdminPanelRole(role) || role === UserRole.EMPLOYEE;
  return false;
}

/** بحث موحّد بالبريد أو الهاتف أو بريد الإشعارات — للموظفين والإدارة فقط */
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

export const { handlers, auth, signIn, signOut, unstable_update } = NextAuth({
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
        const isElevatedAdmin = user.role === UserRole.SUPER_ADMIN || user.role === UserRole.MUNICIPALITY_ADMIN;
        await writeOperationLog({
          actorId: user.id,
          municipalityId: user.municipalityId,
          action: "LOGIN",
          module: "AUTH",
          title: "تسجيل دخول",
          description: `تسجيل دخول إلى واجهة ${surface}`,
          entityType: "USER",
          entityId: user.id,
          metadata: {
            loginPage: surface,
            role: user.role,
            name: user.name,
            email: user.email,
            phone: user.phone,
          },
        });
        return {
          id: user.id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          role: user.role,
          municipalityId: user.municipalityId,
          activeMunicipalityId: user.role === UserRole.SUPER_ADMIN ? null : null,
          permViewRequests: isElevatedAdmin || user.permViewRequests,
          permManageGas: isElevatedAdmin || user.permManageGas,
          permManageGasInventory: isElevatedAdmin || user.permManageGasInventory,
          permManageSocialServices: isElevatedAdmin || user.permManageSocialServices,
          permManageInPersonRequests: isElevatedAdmin || user.permManageInPersonRequests,
          permManageCitizenFeedback: isElevatedAdmin || user.permManageCitizenFeedback,
          permViewCitizens: isElevatedAdmin || user.permViewCitizens,
          permViewOperationLog: isElevatedAdmin || user.permViewOperationLog,
          permManageServices: isElevatedAdmin || user.permManageServices,
          permManageUsers: isElevatedAdmin || user.permManageUsers,
          permViewStats: isElevatedAdmin || user.permViewStats,
          permManageAreaNews: isElevatedAdmin || user.permManageAreaNews,
          permManageArchive: isElevatedAdmin || user.permManageArchive,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        const u = user as {
          id: string;
          role: UserRole;
          email?: string | null;
          phone?: string | null;
          municipalityId?: string | null;
          activeMunicipalityId?: string | null;
          permViewRequests?: boolean;
          permManageGas?: boolean;
          permManageGasInventory?: boolean;
          permManageSocialServices?: boolean;
          permManageInPersonRequests?: boolean;
          permManageCitizenFeedback?: boolean;
          permViewCitizens?: boolean;
          permViewOperationLog?: boolean;
          permManageServices?: boolean;
          permManageUsers?: boolean;
          permViewStats?: boolean;
          permManageAreaNews?: boolean;
          permManageArchive?: boolean;
        };
        token.id = u.id;
        token.role = u.role;
        token.email = u.email;
        token.phone = u.phone;
        token.municipalityId = u.municipalityId ?? null;
        token.activeMunicipalityId =
          u.role === UserRole.SUPER_ADMIN ? (u.activeMunicipalityId ?? null) : null;
        token.permViewRequests = Boolean(u.permViewRequests);
        token.permManageGas = Boolean(u.permManageGas);
        token.permManageGasInventory = Boolean(u.permManageGasInventory);
        token.permManageSocialServices = Boolean(u.permManageSocialServices);
        token.permManageInPersonRequests = Boolean(u.permManageInPersonRequests);
        token.permManageCitizenFeedback = Boolean(u.permManageCitizenFeedback);
        token.permViewCitizens = Boolean(u.permViewCitizens);
        token.permViewOperationLog = Boolean(u.permViewOperationLog);
        token.permManageServices = Boolean(u.permManageServices);
        token.permManageUsers = Boolean(u.permManageUsers);
        token.permViewStats = Boolean(u.permViewStats);
        token.permManageAreaNews = Boolean(u.permManageAreaNews);
        token.permManageArchive = Boolean(u.permManageArchive);
      }
      if (trigger === "update" && session?.user && "activeMunicipalityId" in session.user) {
        token.activeMunicipalityId = session.user.activeMunicipalityId ?? null;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as UserRole;
        session.user.email = (token.email as string | null | undefined) ?? "";
        session.user.phone = (token.phone as string | null | undefined) ?? "";
        session.user.municipalityId = (token.municipalityId as string | null | undefined) ?? null;
        session.user.activeMunicipalityId =
          (token.activeMunicipalityId as string | null | undefined) ?? null;
        session.user.permViewRequests = Boolean(token.permViewRequests);
        session.user.permManageGas = Boolean(token.permManageGas);
        session.user.permManageGasInventory = Boolean(token.permManageGasInventory);
        session.user.permManageSocialServices = Boolean(token.permManageSocialServices);
        session.user.permManageInPersonRequests = Boolean(token.permManageInPersonRequests);
        session.user.permManageCitizenFeedback = Boolean(token.permManageCitizenFeedback);
        session.user.permViewCitizens = Boolean(token.permViewCitizens);
        session.user.permViewOperationLog = Boolean(token.permViewOperationLog);
        session.user.permManageServices = Boolean(token.permManageServices);
        session.user.permManageUsers = Boolean(token.permManageUsers);
        session.user.permViewStats = Boolean(token.permViewStats);
        session.user.permManageAreaNews = Boolean(token.permManageAreaNews);
        session.user.permManageArchive = Boolean(token.permManageArchive);
      }
      return session;
    },
  },
});
