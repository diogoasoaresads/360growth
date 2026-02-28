import "server-only";

import { cookies } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { userContexts, agencies } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import {
  SCOPE_COOKIE,
  AGENCY_ID_COOKIE,
  COOKIE_OPTS,
} from "@/lib/actions/admin/context";
import type { ActiveScope } from "@/lib/db/schema";

export type { ActiveScope };

// ─── Internal helpers ────────────────────────────────────────────────────────

/** Reset a user back to platform scope in both DB and cookie. */
async function resetToPlatform(userId: string): Promise<void> {
  await db
    .update(userContexts)
    .set({ activeScope: "platform", activeAgencyId: null, updatedAt: new Date() })
    .where(eq(userContexts.userId, userId));

  try {
    const store = await cookies();
    store.set(SCOPE_COOKIE, "platform", COOKIE_OPTS);
    store.delete(AGENCY_ID_COOKIE);
  } catch {
    // cookies() not available in all execution contexts — silently ignore
  }
}

/** Cookie-only fallback when DB is unreachable. */
async function getContextFromCookie(): Promise<{
  scope: ActiveScope;
  agencyId: string | null;
  agencyName: string | null;
}> {
  try {
    const store = await cookies();
    const scope: ActiveScope =
      store.get(SCOPE_COOKIE)?.value === "agency" ? "agency" : "platform";
    const agencyId = store.get(AGENCY_ID_COOKIE)?.value ?? null;
    return { scope, agencyId, agencyName: null };
  } catch {
    return { scope: "platform", agencyId: null, agencyName: null };
  }
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Read the active context for a SUPER_ADMIN from the DB (source of truth).
 * Falls back to the cookie if the DB is unreachable.
 * Auto-resets to platform if the stored agency has been deleted.
 */
export async function getActiveContextFromDB(userId: string): Promise<{
  scope: ActiveScope;
  agencyId: string | null;
  agencyName: string | null;
}> {
  try {
    const [row] = await db
      .select({
        scope: userContexts.activeScope,
        agencyId: userContexts.activeAgencyId,
        agencyName: agencies.name,
      })
      .from(userContexts)
      .leftJoin(agencies, eq(agencies.id, userContexts.activeAgencyId))
      .where(eq(userContexts.userId, userId));

    // No context record yet — default to platform
    if (!row) return { scope: "platform", agencyId: null, agencyName: null };

    // Scope is 'agency' but agencyId was set to NULL (ON DELETE SET NULL triggered)
    if (row.scope === "agency" && !row.agencyId) {
      await resetToPlatform(userId);
      return { scope: "platform", agencyId: null, agencyName: null };
    }

    return {
      scope: row.scope ?? "platform",
      agencyId: row.agencyId ?? null,
      agencyName: row.agencyName ?? null,
    };
  } catch (err) {
    console.error("[getActiveContextFromDB] DB error, falling back to cookie:", err);
    return getContextFromCookie();
  }
}

/**
 * Use in /agency/* server actions and page queries to resolve the acting agencyId.
 * - AGENCY_ADMIN / AGENCY_MEMBER: returns their own session agencyId
 * - SUPER_ADMIN: reads from user_contexts DB (always fresh)
 * - Throws a descriptive error if context is missing or invalid
 */
export async function getActiveAgencyIdOrThrow(): Promise<string> {
  const session = await auth();
  if (!session) throw new Error("Unauthorized");

  if (session.user.role !== "SUPER_ADMIN") {
    if (!session.user.agencyId) throw new Error("Agency not found");
    return session.user.agencyId;
  }

  const { scope, agencyId } = await getActiveContextFromDB(session.user.id);
  if (scope !== "agency" || !agencyId) {
    throw new Error(
      "Contexto de agência não definido. Selecione uma agência no topo."
    );
  }
  return agencyId;
}
