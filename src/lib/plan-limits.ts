import { db } from "@/lib/db";
import { agencies, agencyUsers, clients, deals, tickets, plans } from "@/lib/db/schema";
import type { PlanLimits } from "@/lib/db/schema";
import { eq, count } from "drizzle-orm";
import { createAuditLog } from "@/lib/audit-log";

export type LimitResource = "users" | "clients" | "deals" | "tickets";

export interface AgencyUsage {
  users: number;
  clients: number;
  deals: number;
  tickets: number;
}

export interface AgencyLimits {
  maxUsers: number;   // 0 = unlimited
  maxClients: number; // 0 = unlimited
  maxDeals: number;   // 0 = unlimited
  maxTickets: number; // 0 = unlimited
}

export async function getAgencyUsage(agencyId: string): Promise<AgencyUsage> {
  const [[{ usersCount }], [{ clientsCount }], [{ dealsCount }], [{ ticketsCount }]] =
    await Promise.all([
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

export async function getAgencyPlanLimits(agencyId: string): Promise<AgencyLimits> {
  const [agency] = await db
    .select({
      maxMembers: agencies.maxMembers,
      maxClients: agencies.maxClients,
      planId: agencies.planId,
    })
    .from(agencies)
    .where(eq(agencies.id, agencyId));

  if (!agency) return { maxUsers: 0, maxClients: 0, maxDeals: 0, maxTickets: 0 };

  // If agency has a plan with limits JSONB set, use it
  if (agency.planId) {
    const [plan] = await db
      .select({ limits: plans.limits })
      .from(plans)
      .where(eq(plans.id, agency.planId));

    if (plan?.limits) {
      const l = plan.limits as PlanLimits;
      return {
        maxUsers: l.maxUsers ?? 0,
        maxClients: l.maxClients ?? 0,
        maxDeals: l.maxDeals ?? 0,
        maxTickets: l.maxTickets ?? 0,
      };
    }
  }

  // Fall back to per-agency integer overrides (no plan or no limits JSONB)
  return {
    maxUsers: agency.maxMembers ?? 0,
    maxClients: agency.maxClients ?? 0,
    maxDeals: 0,
    maxTickets: 0,
  };
}

export async function validatePlanLimit(
  agencyId: string,
  resource: LimitResource,
  actorUserId: string
): Promise<{ allowed: boolean; error?: string }> {
  const [limits, usage] = await Promise.all([
    getAgencyPlanLimits(agencyId),
    getAgencyUsage(agencyId),
  ]);

  const limitKey = `max${resource.charAt(0).toUpperCase()}${resource.slice(1)}` as keyof AgencyLimits;
  const limit = limits[limitKey];
  const current = usage[resource];

  // 0 means unlimited
  if (limit === 0 || current < limit) {
    return { allowed: true };
  }

  // Blocked — log the event silently
  await createAuditLog({
    userId: actorUserId,
    action: "limit_blocked",
    agencyId,
    details: { resource, current, limit },
  });

  return {
    allowed: false,
    error: "Você atingiu o limite do seu plano.",
  };
}
