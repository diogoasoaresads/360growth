import NextAuth from "next-auth";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/lib/db";
import {
  users,
  accounts,
  sessions,
  verificationTokens,
  agencyUsers,
  agencies,
  userContexts,
} from "@/lib/db/schema";
import type { UserRole, ActiveScope } from "@/lib/db/schema";
import {
  ensureFixedContextForUser,
  getClientIdForUser,
} from "@/lib/context-bootstrap";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: DrizzleAdapter(db, {
    usersTable: users,
    accountsTable: accounts,
    sessionsTable: sessions,
    verificationTokensTable: verificationTokens,
  }),
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) return null;

        const { email, password } = parsed.data;

        const user = await db.query.users.findFirst({
          where: eq(users.email, email),
        });

        if (!user || !user.passwordHash) return null;

        const isValid = await bcrypt.compare(password, user.passwordHash);
        if (!isValid) return null;

        // Track last login
        await db
          .update(users)
          .set({ lastLoginAt: new Date() })
          .where(eq(users.id, user.id));

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
          role: user.role,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id;
        token.role = (user as { role?: UserRole }).role;
        token.isImpersonating = false;
        token.originalAdminId = null;

        // P2-7: bootstrap user_contexts on first login for non-SUPER_ADMIN
        if (token.role && token.role !== "SUPER_ADMIN" && user.id) {
          try {
            if (token.role === "AGENCY_ADMIN" || token.role === "AGENCY_MEMBER") {
              const [agencyRow] = await db
                .select({ agencyId: agencyUsers.agencyId })
                .from(agencyUsers)
                .where(eq(agencyUsers.userId, user.id))
                .limit(1);
              await ensureFixedContextForUser({
                userId: user.id,
                role: token.role,
                agencyId: agencyRow?.agencyId ?? null,
              });
            } else if (token.role === "CLIENT") {
              const clientId = await getClientIdForUser(user.id);
              await ensureFixedContextForUser({
                userId: user.id,
                role: token.role,
                clientId,
              });
            }
          } catch (err) {
            // Never fail login due to bootstrap errors
            console.error("[auth] Context bootstrap error:", err);
          }
        }
      }

      // Don't override impersonation token fields — they are manually set
      // Only refresh agencyId if not impersonating
      if (token.id && token.role !== "SUPER_ADMIN") {
        const agencyUser = await db
          .select({
            agencyId: agencyUsers.agencyId,
            role: agencyUsers.role,
            agencyName: agencies.name,
          })
          .from(agencyUsers)
          .leftJoin(agencies, eq(agencies.id, agencyUsers.agencyId))
          .where(eq(agencyUsers.userId, token.id as string))
          .limit(1)
          .then((rows) => rows[0] ?? null);

        token.agencyId = agencyUser?.agencyId ?? null;
        token.agencyRole = agencyUser?.role ?? null;
        token.agencyName = agencyUser?.agencyName ?? null;
      }

      // For SUPER_ADMIN, populate activeScope/activeAgencyId from user_contexts
      if (token.id && token.role === "SUPER_ADMIN" && !token.isImpersonating) {
        const ctx = await db
          .select({
            activeScope: userContexts.activeScope,
            activeAgencyId: userContexts.activeAgencyId,
          })
          .from(userContexts)
          .where(eq(userContexts.userId, token.id as string))
          .limit(1)
          .then((rows) => rows[0] ?? null);

        token.activeScope = ctx?.activeScope ?? "platform";
        token.activeAgencyId = ctx?.activeAgencyId ?? null;
      }

      if (trigger === "update" && session) {
        token = { ...token, ...session };
      }

      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as UserRole;
        session.user.agencyId = token.agencyId as string | null;
        session.user.agencyRole = token.agencyRole as string | null;
        session.user.agencyName = (token.agencyName as string | null) ?? null;
        session.user.isImpersonating = (token.isImpersonating as boolean) ?? false;
        session.user.originalAdminId = (token.originalAdminId as string | null) ?? null;
        session.user.activeScope = (token.activeScope as ActiveScope | undefined) ?? "platform";
        session.user.activeAgencyId = (token.activeAgencyId as string | null | undefined) ?? null;
      }
      return session;
    },
  },
});

// Helper to check if user has required role
export function hasRole(userRole: UserRole, requiredRoles: UserRole[]): boolean {
  return requiredRoles.includes(userRole);
}

// Type augmentation
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      name?: string | null;
      image?: string | null;
      role: UserRole;
      agencyId: string | null;
      agencyRole: string | null;
      agencyName: string | null;
      isImpersonating: boolean;
      originalAdminId: string | null;
      activeScope: ActiveScope;
      activeAgencyId: string | null;
    };
  }

  interface User {
    role?: UserRole;
  }
}

declare module "@auth/core/jwt" {
  interface JWT {
    id?: string;
    role?: UserRole;
    agencyId?: string | null;
    agencyRole?: string | null;
    agencyName?: string | null;
    isImpersonating?: boolean;
    originalAdminId?: string | null;
    activeScope?: ActiveScope;
    activeAgencyId?: string | null;
  }
}
