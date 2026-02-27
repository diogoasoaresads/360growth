"use server";

import { db } from "@/lib/db";
import {
  agencies,
  users,
  tickets,
  plans,
  auditLogs,
} from "@/lib/db/schema";
import { auth } from "@/lib/auth";
import { eq, count, and, gte, lte, sql, desc, isNull } from "drizzle-orm";
import { unstable_cache } from "next/cache";
import type { ActionResult } from "@/lib/types";

async function requireSuperAdmin() {
  const session = await auth();
  if (!session || session.user.role !== "SUPER_ADMIN") {
    throw new Error("Não autorizado");
  }
  return session;
}

export interface DashboardMetrics {
  totalAgencies: number;
  agenciesChange: number; // absolute delta vs last month
  activeAgencies: number;
  activePercentage: number;
  totalUsers: number;
  newUsersThisMonth: number;
  mrr: number; // in cents
  mrrChange: number; // % change vs last month
  openTickets: number;
  churnRate: number; // percentage
}

export interface GrowthDataPoint {
  month: string; // "Jan", "Fev"...
  cumulative: number;
  newThisMonth: number;
}

export interface RevenueByPlan {
  plan: string;
  revenue: number;
  count: number;
}

export interface PlanDistribution {
  plan: string;
  count: number;
  percentage: number;
}

export interface ActivityItem {
  id: string;
  action: string;
  description: string;
  actorName: string | null;
  actorImage: string | null;
  agencyName: string | null;
  createdAt: Date;
  icon: "agency" | "upgrade" | "cancel" | "ticket" | "user" | "default";
}

// ─────────────────────────────────────────────────────────
// KPI METRICS
// ─────────────────────────────────────────────────────────

const _getDashboardMetrics = unstable_cache(
  async (): Promise<DashboardMetrics> => {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const [
      [{ total: totalAgencies }],
      [{ total: agenciesLastMonth }],
      [{ total: activeAgencies }],
      [{ total: totalUsers }],
      [{ total: newUsersThisMonth }],
      [{ total: openTickets }],
      allPlansWithAgencies,
      cancelledThisMonth,
    ] = await Promise.all([
      // Total agencies (not deleted)
      db.select({ total: count() }).from(agencies).where(isNull(agencies.deletedAt)),

      // Agencies at end of last month
      db
        .select({ total: count() })
        .from(agencies)
        .where(
          and(
            isNull(agencies.deletedAt),
            lte(agencies.createdAt, endOfLastMonth)
          )
        ),

      // Active agencies
      db
        .select({ total: count() })
        .from(agencies)
        .where(
          and(
            isNull(agencies.deletedAt),
            eq(agencies.active, true),
            eq(agencies.agencyStatus, "active")
          )
        ),

      // Total users
      db.select({ total: count() }).from(users),

      // New users this month
      db
        .select({ total: count() })
        .from(users)
        .where(gte(users.createdAt, startOfMonth)),

      // Open tickets
      db
        .select({ total: count() })
        .from(tickets)
        .where(
          sql`${tickets.status} IN ('OPEN', 'IN_PROGRESS')`
        ),

      // Active subscriptions → MRR
      db
        .select({
          priceMonthly: plans.priceMonthly,
          agencyCount: count(agencies.id),
        })
        .from(agencies)
        .innerJoin(plans, eq(plans.id, agencies.planId))
        .where(
          and(
            isNull(agencies.deletedAt),
            eq(agencies.subscriptionStatus, "active")
          )
        )
        .groupBy(plans.id, plans.priceMonthly),

      // Cancelled this period
      db
        .select({ total: count() })
        .from(agencies)
        .where(
          and(
            eq(agencies.agencyStatus, "cancelled"),
            gte(agencies.updatedAt, thirtyDaysAgo)
          )
        ),
    ]);

    const agenciesChange = totalAgencies - agenciesLastMonth;
    const activePercentage =
      totalAgencies > 0 ? Math.round((activeAgencies / totalAgencies) * 100) : 0;

    const mrr = allPlansWithAgencies.reduce(
      (sum, row) => sum + parseFloat(row.priceMonthly ?? "0") * row.agencyCount,
      0
    );

    // Simple churn: cancelled in period / (total at start of period)
    const baseAgencies = totalAgencies + (cancelledThisMonth[0]?.total ?? 0);
    const churnRate =
      baseAgencies > 0
        ? Math.round(((cancelledThisMonth[0]?.total ?? 0) / baseAgencies) * 100 * 10) / 10
        : 0;

    return {
      totalAgencies,
      agenciesChange,
      activeAgencies,
      activePercentage,
      totalUsers,
      newUsersThisMonth,
      mrr,
      mrrChange: 0, // requires historical data — placeholder
      openTickets,
      churnRate,
    };
  },
  ["dashboard-metrics"],
  { revalidate: 300 }
);

export async function getDashboardMetrics(): Promise<ActionResult<DashboardMetrics>> {
  try {
    await requireSuperAdmin();
    const data = await _getDashboardMetrics();
    return { success: true, data };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Erro ao buscar métricas" };
  }
}

// ─────────────────────────────────────────────────────────
// GROWTH CHART (últimos N meses)
// ─────────────────────────────────────────────────────────

const _getGrowthData = unstable_cache(
  async (months: number): Promise<GrowthDataPoint[]> => {
    const now = new Date();
    const points: GrowthDataPoint[] = [];

    for (let i = months - 1; i >= 0; i--) {
      const start = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59);

      const [{ newThisMonth }] = await db
        .select({ newThisMonth: count() })
        .from(agencies)
        .where(
          and(
            isNull(agencies.deletedAt),
            gte(agencies.createdAt, start),
            lte(agencies.createdAt, end)
          )
        );

      const [{ cumulative }] = await db
        .select({ cumulative: count() })
        .from(agencies)
        .where(
          and(
            isNull(agencies.deletedAt),
            lte(agencies.createdAt, end)
          )
        );

      const monthNames = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
      points.push({
        month: monthNames[start.getMonth()],
        cumulative,
        newThisMonth,
      });
    }

    return points;
  },
  ["dashboard-growth"],
  { revalidate: 300 }
);

export async function getGrowthData(
  months: number = 12
): Promise<ActionResult<GrowthDataPoint[]>> {
  try {
    await requireSuperAdmin();
    const data = await _getGrowthData(months);
    return { success: true, data };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Erro ao buscar dados de crescimento" };
  }
}

// ─────────────────────────────────────────────────────────
// REVENUE BY PLAN
// ─────────────────────────────────────────────────────────

const _getRevenueByPlan = unstable_cache(
  async (): Promise<RevenueByPlan[]> => {
    const rows = await db
      .select({
        planName: plans.name,
        priceMonthly: plans.priceMonthly,
        agencyCount: count(agencies.id),
      })
      .from(plans)
      .leftJoin(
        agencies,
        and(
          eq(agencies.planId, plans.id),
          isNull(agencies.deletedAt),
          eq(agencies.subscriptionStatus, "active")
        )
      )
      .where(eq(plans.isActive, true))
      .groupBy(plans.id, plans.name, plans.priceMonthly, plans.sortOrder)
      .orderBy(plans.sortOrder);

    return rows.map((r) => ({
      plan: r.planName,
      revenue: parseFloat(r.priceMonthly ?? "0") * r.agencyCount,
      count: r.agencyCount,
    }));
  },
  ["dashboard-revenue"],
  { revalidate: 300 }
);

export async function getRevenueByPlan(): Promise<ActionResult<RevenueByPlan[]>> {
  try {
    await requireSuperAdmin();
    const data = await _getRevenueByPlan();
    return { success: true, data };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Erro ao buscar receita" };
  }
}

// ─────────────────────────────────────────────────────────
// PLAN DISTRIBUTION
// ─────────────────────────────────────────────────────────

const _getPlanDistribution = unstable_cache(
  async (): Promise<PlanDistribution[]> => {
    const rows = await db
      .select({
        planName: plans.name,
        agencyCount: count(agencies.id),
      })
      .from(plans)
      .leftJoin(
        agencies,
        and(eq(agencies.planId, plans.id), isNull(agencies.deletedAt))
      )
      .where(eq(plans.isActive, true))
      .groupBy(plans.id, plans.name, plans.sortOrder)
      .orderBy(plans.sortOrder);

    const total = rows.reduce((s, r) => s + r.agencyCount, 0);

    return rows.map((r) => ({
      plan: r.planName,
      count: r.agencyCount,
      percentage: total > 0 ? Math.round((r.agencyCount / total) * 100) : 0,
    }));
  },
  ["dashboard-plan-dist"],
  { revalidate: 300 }
);

export async function getPlanDistribution(): Promise<ActionResult<PlanDistribution[]>> {
  try {
    await requireSuperAdmin();
    const data = await _getPlanDistribution();
    return { success: true, data };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Erro ao buscar distribuição" };
  }
}

// ─────────────────────────────────────────────────────────
// RECENT ACTIVITY
// ─────────────────────────────────────────────────────────

function classifyAction(action: string): ActivityItem["icon"] {
  if (action.includes("agency.created")) return "agency";
  if (action.includes("agency.upgraded") || action.includes("subscription")) return "upgrade";
  if (action.includes("agency.cancelled") || action.includes("canceled")) return "cancel";
  if (action.includes("ticket")) return "ticket";
  if (action.includes("user")) return "user";
  return "default";
}

function formatActionDescription(action: string, agencyName: string | null, actorName: string | null): string {
  const agency = agencyName ? `"${agencyName}"` : "Agência";
  const actor = actorName ?? "Usuário";

  const map: Record<string, string> = {
    "agency.created": `Nova agência ${agency} criada`,
    "agency.updated": `Agência ${agency} atualizada`,
    "agency.deleted": `Agência ${agency} removida`,
    "agency.status_changed": `Status de ${agency} alterado`,
    "user.created": `Novo usuário ${actor} cadastrado`,
    "user.updated": `Usuário ${actor} atualizado`,
    "user.suspended": `Usuário ${actor} suspenso`,
    "user.activated": `Usuário ${actor} ativado`,
    "user.impersonated": `${actor} iniciou impersonation`,
    "user.password_reset": `Reset de senha para ${actor}`,
    "ticket.created": `Novo ticket aberto`,
    "ticket.replied": `Resposta em ticket`,
    "ticket.resolved": `Ticket resolvido`,
    "ticket.status_changed": `Status de ticket alterado`,
  };

  return map[action] ?? action;
}

export async function getRecentActivity(
  limit: number = 10
): Promise<ActionResult<ActivityItem[]>> {
  try {
    await requireSuperAdmin();

    const logs = await db
      .select({
        id: auditLogs.id,
        action: auditLogs.action,
        createdAt: auditLogs.createdAt,
        agencyId: auditLogs.agencyId,
        userId: auditLogs.userId,
      })
      .from(auditLogs)
      .orderBy(desc(auditLogs.createdAt))
      .limit(limit);

    // Collect unique agency/user IDs for batch fetch
    const agencyIds = Array.from(new Set(logs.map((l) => l.agencyId).filter(Boolean) as string[]));
    const userIds = Array.from(new Set(logs.map((l) => l.userId).filter(Boolean) as string[]));

    const [agencyRows, userRows] = await Promise.all([
      agencyIds.length
        ? db
            .select({ id: agencies.id, name: agencies.name })
            .from(agencies)
            .where(sql`${agencies.id} = ANY(ARRAY[${sql.join(agencyIds.map((id) => sql`${id}`), sql`, `)}]::text[])`)
        : Promise.resolve([]),
      userIds.length
        ? db
            .select({ id: users.id, name: users.name, image: users.image })
            .from(users)
            .where(sql`${users.id} = ANY(ARRAY[${sql.join(userIds.map((id) => sql`${id}`), sql`, `)}]::text[])`)
        : Promise.resolve([]),
    ]);

    const agencyMap = new Map(agencyRows.map((a) => [a.id, a.name]));
    const userMap = new Map(userRows.map((u) => [u.id, u]));

    const data: ActivityItem[] = logs.map((log) => {
      const agencyName = log.agencyId ? (agencyMap.get(log.agencyId) ?? null) : null;
      const actor = log.userId ? userMap.get(log.userId) : null;

      return {
        id: log.id,
        action: log.action,
        description: formatActionDescription(log.action, agencyName, actor?.name ?? null),
        actorName: actor?.name ?? null,
        actorImage: actor?.image ?? null,
        agencyName,
        createdAt: log.createdAt,
        icon: classifyAction(log.action),
      };
    });

    return { success: true, data };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Erro ao buscar atividades" };
  }
}
