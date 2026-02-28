import "server-only";

import { cookies } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { userContexts, agencies, clients } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import {
  SCOPE_COOKIE,
  AGENCY_ID_COOKIE,
  COOKIE_OPTS,
} from "@/lib/actions/admin/context.constants";
import type { ActiveScope } from "@/lib/db/schema";

export type { ActiveScope };

// ─── Internal helpers ────────────────────────────────────────────────────────

/** Reset a SUPER_ADMIN back to platform scope in both DB and cookie. */
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

/** Cookie-only fallback when DB is unreachable (SUPER_ADMIN only). */
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
 * Falls back to cookie if the DB is unreachable.
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

    if (!row) return { scope: "platform", agencyId: null, agencyName: null };

    // Agency was deleted → reset
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
 * Resolve the acting agencyId for the current session.
 *
 * - SUPER_ADMIN:           reads from user_contexts (context switcher)
 * - AGENCY_ADMIN/MEMBER:  reads from user_contexts (bootstrapped on login);
 *                         falls back to session.user.agencyId for users
 *                         who logged in before P2-7 bootstrap was added
 *
 * Use this in every /agency/* server action and page query.
 */
export async function getActiveAgencyIdOrThrow(): Promise<string> {
  const session = await auth();
  if (!session) throw new Error("Unauthorized");

  const { role } = session.user;

  if (role === "SUPER_ADMIN") {
    const { scope, agencyId } = await getActiveContextFromDB(session.user.id);
    if (scope !== "agency" || !agencyId) {
      throw new Error(
        "Contexto de agência não definido. Selecione uma agência no topo."
      );
    }
    return agencyId;
  }

  if (role !== "AGENCY_ADMIN" && role !== "AGENCY_MEMBER") {
    throw new Error("Acesso negado");
  }

  // AGENCY_ADMIN / AGENCY_MEMBER — read from user_contexts (P2-7 source of truth)
  try {
    const [ctx] = await db
      .select({ agencyId: userContexts.activeAgencyId })
      .from(userContexts)
      .where(eq(userContexts.userId, session.user.id))
      .limit(1);

    if (ctx?.agencyId) return ctx.agencyId;
  } catch {
    // DB unreachable — fall through to session fallback
  }

  // Backward-compat fallback: session.user.agencyId (pre-P2-7 logins)
  if (session.user.agencyId) return session.user.agencyId;

  throw new Error("Agência não configurada. Faça login novamente.");
}

/**
 * Resolve the acting clientId for the current session.
 *
 * - CLIENT:  reads from user_contexts (bootstrapped on login);
 *            falls back to clients table lookup for pre-P2-7 logins
 *
 * Use this in every /portal/* server action and page query.
 */
export async function getActiveClientIdOrThrow(): Promise<string> {
  const session = await auth();
  if (!session) throw new Error("Unauthorized");

  if (session.user.role !== "CLIENT") {
    throw new Error("Acesso negado: apenas clientes podem acessar este recurso");
  }

  // Read from user_contexts (P2-7 source of truth)
  try {
    const [ctx] = await db
      .select({ clientId: userContexts.activeClientId })
      .from(userContexts)
      .where(eq(userContexts.userId, session.user.id))
      .limit(1);

    if (ctx?.clientId) return ctx.clientId;
  } catch {
    // DB unreachable — fall through to direct lookup
  }

  // Backward-compat fallback: direct lookup from clients table
  const client = await db.query.clients.findFirst({
    where: eq(clients.userId, session.user.id),
    columns: { id: true },
  });
  if (client?.id) return client.id;

  throw new Error("Perfil de cliente não encontrado. Entre em contato com sua agência.");
}
