import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { UserRole } from "@/generated/prisma/enums";
import { db } from "@/lib/db";
import { digitsOnly } from "@/lib/phone";
import { verifyPassword } from "@/lib/password";
import type { AuthPortal } from "@/lib/auth-portal";

/** فصل البوابات: لا يُقبل موظف عبر portal=citizen ولا مواطن عبر portal=staff */
function portalAllowsRole(portal: AuthPortal, role: UserRole) {
  if (portal === "citizen") return role === UserRole.CITIZEN;
  if (portal === "staff") return role === UserRole.EMPLOYEE || role === UserRole.ADMIN;
  return false;
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  secret: process.env.AUTH_SECRET,
  trustHost: true,
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
        const byEmail = id.includes("@");
        const user = byEmail
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
        return {
          id: user.id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          role: user.role,
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
        };
        token.id = u.id;
        token.role = u.role;
        token.email = u.email;
        token.phone = u.phone;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as UserRole;
        session.user.email = (token.email as string | null | undefined) ?? "";
        session.user.phone = (token.phone as string | null | undefined) ?? "";
      }
      return session;
    },
  },
});
