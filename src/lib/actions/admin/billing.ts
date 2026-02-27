"use server";

import { db } from "@/lib/db";
import { agencies, plans } from "@/lib/db/schema";
import { auth } from "@/lib/auth";
import { eq, and, count, gte, sql } from "drizzle-orm";
import type { ActionResult } from "@/lib/types";

async function requireSuperAdmin() {
  const session = await auth();
  if (!session || session.user.role !== "SUPER_ADMIN") {
    throw new Error("Não autorizado");
  }
  return session;
}

export interface BillingMetrics {
  mrr: number;
  arr: number;
  payingAgencies: number;
  averageTicket: number;
  churnRate: number;
  ltv: number;
}

export interface Transaction {
  id: string;
  date: Date;
  agencyId: string;
  agencyName: string;
  type: "payment" | "refund" | "failure";
  description: string;
  amount: number;
  status: "success" | "pending" | "failed";
}

export interface MonthlyRevenue {
  month: string;    // "Jan", "Fev", ...
  monthKey: string; // "YYYY-MM"
  revenue: number;
}

const MONTH_LABELS_PT: Record<string, string> = {
  "01": "Jan", "02": "Fev", "03": "Mar", "04": "Abr",
  "05": "Mai", "06": "Jun", "07": "Jul", "08": "Ago",
  "09": "Set", "10": "Out", "11": "Nov", "12": "Dez",
};

export async function getBillingMetrics(): Promise<ActionResult<BillingMetrics>> {
  try {
    await requireSuperAdmin();

    const [activeRows, cancelledCount, totalCount] = await Promise.all([
      db
        .select({ planPrice: plans.priceMonthly })
        .from(agencies)
        .leftJoin(plans, eq(agencies.planId, plans.id))
        .where(eq(agencies.subscriptionStatus, "active")),

      db
        .select({ total: count() })
        .from(agencies)
        .where(eq(agencies.agencyStatus, "cancelled")),

      db
        .select({ total: count() })
        .from(agencies),
    ]);

    const mrr = activeRows.reduce((sum, r) => sum + Number(r.planPrice ?? 0), 0);
    const arr = mrr * 12;
    const payingAgencies = activeRows.length;
    const averageTicket = payingAgencies > 0 ? mrr / payingAgencies : 0;

    const cancelled = Number(cancelledCount[0]?.total ?? 0);
    const total = Number(totalCount[0]?.total ?? 1);
    const churnRate = total > 0 ? (cancelled / total) * 100 : 0;
    // LTV = average ticket / monthly churn rate; if churn is 0, use 24× ticket
    const monthlyChurn = churnRate / 100;
    const ltv = monthlyChurn > 0 ? averageTicket / monthlyChurn : averageTicket * 24;

    return { success: true, data: { mrr, arr, payingAgencies, averageTicket, churnRate, ltv } };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Erro ao buscar métricas" };
  }
}

export async function getRecentTransactions(
  limit: number = 20
): Promise<ActionResult<Transaction[]>> {
  try {
    await requireSuperAdmin();

    // No transactions table yet — derive from agency subscriptions
    const rows = await db
      .select({
        agencyId: agencies.id,
        agencyName: agencies.name,
        planName: plans.name,
        planPrice: plans.priceMonthly,
        createdAt: agencies.createdAt,
        subscriptionStatus: agencies.subscriptionStatus,
      })
      .from(agencies)
      .leftJoin(plans, eq(agencies.planId, plans.id))
      .where(and(eq(agencies.subscriptionStatus, "active")))
      .orderBy(sql`${agencies.createdAt} DESC`)
      .limit(limit);

    const transactions: Transaction[] = rows.map((r) => ({
      id: `txn_${r.agencyId.slice(0, 8)}`,
      date: r.createdAt,
      agencyId: r.agencyId,
      agencyName: r.agencyName,
      type: "payment" as const,
      description: `Plano ${r.planName ?? "—"} — Mensal`,
      amount: Number(r.planPrice ?? 0),
      status: "success" as const,
    }));

    return { success: true, data: transactions };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Erro ao buscar transações" };
  }
}

export async function getMonthlyRevenue(
  months: number = 6
): Promise<ActionResult<MonthlyRevenue[]>> {
  try {
    await requireSuperAdmin();

    const fromDate = new Date();
    fromDate.setMonth(fromDate.getMonth() - months + 1);
    fromDate.setDate(1);
    fromDate.setHours(0, 0, 0, 0);

    const rows = await db
      .select({
        monthKey: sql<string>`TO_CHAR(${agencies.createdAt}, 'YYYY-MM')`,
        revenue: sql<number>`COALESCE(SUM(${plans.priceMonthly}::numeric), 0)`,
      })
      .from(agencies)
      .leftJoin(plans, eq(agencies.planId, plans.id))
      .where(
        and(
          eq(agencies.subscriptionStatus, "active"),
          gte(agencies.createdAt, fromDate)
        )
      )
      .groupBy(sql`TO_CHAR(${agencies.createdAt}, 'YYYY-MM')`)
      .orderBy(sql`TO_CHAR(${agencies.createdAt}, 'YYYY-MM') ASC`);

    // Build full month list with zeros for empty months
    const revenueMap = new Map<string, number>(
      rows.map((r) => [r.monthKey, Number(r.revenue)])
    );

    const result: MonthlyRevenue[] = [];
    const now = new Date();
    for (let i = months - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const monthNum = String(d.getMonth() + 1).padStart(2, "0");
      result.push({
        monthKey: key,
        month: MONTH_LABELS_PT[monthNum] ?? key,
        revenue: revenueMap.get(key) ?? 0,
      });
    }

    return { success: true, data: result };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Erro ao buscar receita mensal" };
  }
}
