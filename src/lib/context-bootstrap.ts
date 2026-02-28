/**
 * context-bootstrap.ts
 *
 * Low-level DB helpers for user_contexts.
 * MUST NOT import from @/lib/auth to avoid circular dependencies.
 * Safe to import from auth.ts and active-context.ts.
 */
import "server-only";

import { db } from "@/lib/db";
import { userContexts, agencyUsers, clients } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import type { UserRole, ActiveScope } from "@/lib/db/schema";

// ─── Types ──────────────────────────────────────────────────────────────────

export interface UserContextRow {
  activeScope: ActiveScope;
  activeAgencyId: string | null;
  activeClientId: string | null;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Look up the clientId for a CLIENT-role user.
 * Returns null if the user has no associated client record.
 */
export async function getClientIdForUser(userId: string): Promise<string | null> {
  const client = await db.query.clients.findFirst({
    where: eq(clients.userId, userId),
    columns: { id: true },
  });
  return client?.id ?? null;
}

/**
 * Look up the agencyId for an AGENCY_ADMIN / AGENCY_MEMBER.
 * Returns null if the user has no agency association.
 */
export async function getAgencyIdForUser(userId: string): Promise<string | null> {
  const [row] = await db
    .select({ agencyId: agencyUsers.agencyId })
    .from(agencyUsers)
    .where(eq(agencyUsers.userId, userId))
    .limit(1);
  return row?.agencyId ?? null;
}

/**
 * Read the raw user_contexts row for any user.
 * Returns null when no row exists.
 */
export async function getUserContextRow(userId: string): Promise<UserContextRow | null> {
  const [row] = await db
    .select({
      activeScope: userContexts.activeScope,
      activeAgencyId: userContexts.activeAgencyId,
      activeClientId: userContexts.activeClientId,
    })
    .from(userContexts)
    .where(eq(userContexts.userId, userId))
    .limit(1);
  return row ?? null;
}

/**
 * Bootstrap (upsert) a fixed context into user_contexts for non-SUPER_ADMIN roles.
 *
 * - AGENCY_ADMIN / AGENCY_MEMBER → scope="agency", agencyId required
 * - CLIENT                       → scope="client",  clientId required
 * - SUPER_ADMIN                  → no-op (context switcher manages this)
 *
 * Called once on login from the NextAuth JWT callback.
 * Idempotent: safe to call on every login.
 */
export async function ensureFixedContextForUser(params: {
  userId: string;
  role: UserRole;
  agencyId?: string | null;
  clientId?: string | null;
}): Promise<void> {
  const { userId, role, agencyId, clientId } = params;

  if (role === "SUPER_ADMIN") return; // switcher handles SUPER_ADMIN

  if (role === "AGENCY_ADMIN" || role === "AGENCY_MEMBER") {
    if (!agencyId) return; // no agencyId → nothing to bootstrap
    await db
      .insert(userContexts)
      .values({
        userId,
        activeScope: "agency",
        activeAgencyId: agencyId,
        activeClientId: null,
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: userContexts.userId,
        set: {
          activeScope: "agency",
          activeAgencyId: agencyId,
          activeClientId: null,
          updatedAt: new Date(),
        },
      });
    return;
  }

  if (role === "CLIENT") {
    if (!clientId) return; // no clientId → nothing to bootstrap
    await db
      .insert(userContexts)
      .values({
        userId,
        activeScope: "client",
        activeAgencyId: null,
        activeClientId: clientId,
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: userContexts.userId,
        set: {
          activeScope: "client",
          activeAgencyId: null,
          activeClientId: clientId,
          updatedAt: new Date(),
        },
      });
  }
}
