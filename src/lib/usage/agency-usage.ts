import "server-only";

import { db } from "@/lib/db";
import { agencies, agencyUsers, clients, deals, tickets, plans } from "@/lib/db/schema";
import { eq, count } from "drizzle-orm";
import { createAuditLog } from "@/lib/audit-log";

export type LimitResourceType = "users" | "clients" | "deals" | "tickets";

export interface AgencyUsage {
  users: number;
  clients: number;
  deals: number;
  tickets: number;
}

// Map resource type to the JSONB field name in plans.limits
const LIMIT_FIELD_MAP: Record<LimitResourceType, string> = {
  users: "maxUsers",
  clients: "maxClients",
  deals: "maxDeals",
  tickets: "maxTickets",
};

/** Returns null to mean "unlimited". */
function resolveLimit(
  limitsJson: Record<string, unknown>,
  resource: LimitResourceType
): number | null {
  // Support new-style field names (e.g. "users") and legacy (e.g. "maxUsers")
  const legacyKey = LIMIT_FIELD_MAP[resource];
  const raw = limitsJson[resource] !== undefined ? limitsJson[resource] : limitsJson[legacyKey];

  if (raw === null || raw === undefined) return null; // null/missing = unlimited
  const n = Number(raw);
  if (isNaN(n) || n <= 0) return null; // 0 or negative = unlimited
  return n;
}

export async function getAgencyUsage(agencyId: string): Promise<AgencyUsage> {
  const [
    [{ usersCount }],
    [{ clientsCount }],
    [{ dealsCount }],
    [{ ticketsCount }],
  ] = await Promise.all([
    db.select({ usersCount: count() }).from(agencyUsers).where(eq(agencyUsers.agencyId, agencyId)),
    db.select({ clientsCount: count() }).from(clients).where(eq(clients.agencyId, agencyId)),
    db.select({ dealsCount: count() }).from(deals).where(eq(deals.agencyId, agencyId)),
    db.select({ ticketsCount: count() }).from(tickets).where(eq(tickets.agencyId, agencyId)),
  ]);

  return {
    users: usersCount,
    clients: clientsCount,
    deals: dealsCount,
    tickets: ticketsCount,
  };
}

/**
 * Validates whether an agency is allowed to create a new resource.
 * Throws a pt-BR error if the plan limit has been reached.
 * Logs a `limit_blocked` audit event before throwing.
 */
export async function validatePlanLimit({
  agencyId,
  actorUserId,
  resourceType,
  context,
}: {
  agencyId: string;
  actorUserId?: string;
  resourceType: LimitResourceType;
  context?: string;
}): Promise<void> {
  const [agency] = await db
    .select({ planId: agencies.planId, maxMembers: agencies.maxMembers, maxClients: agencies.maxClients })
    .from(agencies)
    .where(eq(agencies.id, agencyId));

  if (!agency) return; // Unknown agency — no enforcement

  let limitsJson: Record<string, unknown> = {};

  if (agency.planId) {
    const [plan] = await db
      .select({ limits: plans.limits })
      .from(plans)
      .where(eq(plans.id, agency.planId));

    if (plan?.limits && typeof plan.limits === "object") {
      limitsJson = plan.limits as unknown as Record<string, unknown>;
    }
  }

  // Fallback to per-agency integer overrides when no plan JSONB is present
  if (Object.keys(limitsJson).length === 0) {
    limitsJson = {
      maxUsers: agency.maxMembers ?? 0,
      maxClients: agency.maxClients ?? 0,
    };
  }

  const limit = resolveLimit(limitsJson, resourceType);
  if (limit === null) return; // Unlimited — allow

  const usage = await getAgencyUsage(agencyId);
  const current = usage[resourceType];

  if (current < limit) return; // Under limit — allow

  // Limit reached — log and throw
  if (actorUserId) {
    await createAuditLog({
      userId: actorUserId,
      action: "limit_blocked",
      agencyId,
      details: { resourceType, current, limit, context },
    });
  }

  throw new Error(
    `Limite do plano atingido para ${resourceType}. Faça upgrade do plano.`
  );
}
