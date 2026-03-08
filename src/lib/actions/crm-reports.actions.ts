"use server";

import { db } from "@/lib/db";
import { deals, pipelineStages } from "@/lib/db/schema";
import { eq, and, sql, desc } from "drizzle-orm";
import { getActiveAgencyIdOrThrow } from "@/lib/active-context";

export interface ChannelMetric {
    channel: string;
    leads: number;
    deals: number;
    won: number;
    revenue: number;
    conversionRate: number;
    avgTicket: number;
}

export async function getRevenueByChannel(filters?: { clientId?: string; pipelineId?: string }) {
    const agencyId = await getActiveAgencyIdOrThrow();

    const whereClauses = [eq(deals.agencyId, agencyId)];
    if (filters?.clientId) whereClauses.push(eq(deals.clientId, filters.clientId));
    if (filters?.pipelineId) whereClauses.push(eq(deals.pipelineId, filters.pipelineId));

    // Agregação por utmSource ou leadSource
    const results = await db.select({
        channel: sql<string>`COALESCE(${deals.utmSource}, ${deals.leadSource}, 'Direto/Orgânico')`,
        totalDeals: sql<number>`count(${deals.id})`,
        wonDeals: sql<number>`count(CASE WHEN ${deals.status} = 'WON' THEN 1 END)`,
        totalRevenue: sql<number>`sum(CASE WHEN ${deals.status} = 'WON' THEN ${deals.value} ELSE 0 END)`,
    })
        .from(deals)
        .where(and(...whereClauses))
        .groupBy(sql`COALESCE(${deals.utmSource}, ${deals.leadSource}, 'Direto/Orgânico')`)
        .orderBy(desc(sql`sum(CASE WHEN ${deals.status} = 'WON' THEN ${deals.value} ELSE 0 END)`));

    return results.map(r => ({
        channel: r.channel,
        leads: r.totalDeals, // Simplificado: cada deal no CRM é considerado um lead qualificado aqui
        deals: r.totalDeals,
        won: r.wonDeals,
        revenue: Number(r.totalRevenue || 0),
        conversionRate: r.totalDeals > 0 ? (r.wonDeals / r.totalDeals) * 100 : 0,
        avgTicket: r.wonDeals > 0 ? Number(r.totalRevenue || 0) / r.wonDeals : 0,
    })) as ChannelMetric[];
}

export async function getExecutiveMetrics(filters?: { clientId?: string; pipelineId?: string }) {
    const agencyId = await getActiveAgencyIdOrThrow();

    const whereClauses = [eq(deals.agencyId, agencyId)];
    if (filters?.clientId) whereClauses.push(eq(deals.clientId, filters.clientId));
    if (filters?.pipelineId) whereClauses.push(eq(deals.pipelineId, filters.pipelineId));

    const [generalMetrics] = await db.select({
        totalPipelineValue: sql<number>`sum(${deals.value})`,
        wonRevenue: sql<number>`sum(CASE WHEN ${deals.status} = 'WON' THEN ${deals.value} ELSE 0 END)`,
        totalDeals: sql<number>`count(*)`,
        wonDeals: sql<number>`count(CASE WHEN ${deals.status} = 'WON' THEN 1 END)`,
        avgCycleDays: sql<number>`avg(EXTRACT(DAY FROM ${deals.closedAt} - ${deals.createdAt})) FILTER (WHERE ${deals.status} = 'WON')`,
    })
        .from(deals)
        .where(and(...whereClauses));

    return {
        totalValue: Number(generalMetrics?.totalPipelineValue || 0),
        wonRevenue: Number(generalMetrics?.wonRevenue || 0),
        totalDeals: Number(generalMetrics?.totalDeals || 0),
        wonDeals: Number(generalMetrics?.wonDeals || 0),
        conversionRate: generalMetrics?.totalDeals ? (Number(generalMetrics.wonDeals) / Number(generalMetrics.totalDeals)) * 100 : 0,
        avgCycleDays: Math.round(Number(generalMetrics?.avgCycleDays || 0)),
    };
}

export async function getSellerRanking(filters?: { clientId?: string; pipelineId?: string }) {
    const agencyId = await getActiveAgencyIdOrThrow();

    const whereClauses = [eq(deals.agencyId, agencyId)];
    if (filters?.clientId) whereClauses.push(eq(deals.clientId, filters.clientId));
    if (filters?.pipelineId) whereClauses.push(eq(deals.pipelineId, filters.pipelineId));

    const results = await db.execute(sql`
        SELECT 
            u.name,
            u.image as avatar,
            count(d.id) as total_deals,
            count(d.id) FILTER (WHERE d.status = 'WON') as won_deals,
            sum(CASE WHEN d.status = 'WON' THEN d.value ELSE 0 END) as total_revenue
        FROM deals d
        LEFT JOIN users u ON d.responsible_id = u.id
        WHERE d.agency_id = ${agencyId}
        ${filters?.clientId ? sql`AND d.client_id = ${filters.clientId}` : sql``}
        ${filters?.pipelineId ? sql`AND d.pipeline_id = ${filters.pipelineId}` : sql``}
        GROUP BY u.name, u.image
        ORDER BY total_revenue DESC
    `);

    return results.map(r => ({
        name: String(r.name || 'Sem Responsável'),
        avatar: String(r.avatar || ''),
        deals: Number(r.won_deals || 0),
        revenue: Number(r.total_revenue || 0),
        conversion: r.total_deals ? `${((Number(r.won_deals) / Number(r.total_deals)) * 100).toFixed(0)}%` : '0%'
    }));
}
