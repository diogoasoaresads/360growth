"use server";

import { db } from "@/lib/db";
import { deals, tickets } from "@/lib/db/schema";
import { eq, and, gte, lte } from "drizzle-orm";
import { getActiveAgencyIdOrThrow } from "@/lib/active-context";

/**
 * Helper to convert array of objects to CSV string
 */
function convertToCSV(data: Record<string, unknown>[]) {
    if (data.length === 0) return "";
    const headers = Object.keys(data[0]).join(",");
    const rows = data.map(obj =>
        Object.values(obj)
            .map(val => `"${String(val ?? "").replace(/"/g, '""')}"`)
            .join(",")
    );
    return [headers, ...rows].join("\n");
}

export async function exportDealsCSV(from?: Date, to?: Date) {
    const agencyId = await getActiveAgencyIdOrThrow();

    const filters = [eq(deals.agencyId, agencyId)];
    if (from) filters.push(gte(deals.createdAt, from));
    if (to) filters.push(lte(deals.createdAt, to));

    const result = await db.query.deals.findMany({
        where: and(...filters),
        with: { client: true }
    });

    const flatData = result.map(d => ({
        ID: d.id,
        Titulo: d.title,
        Cliente: d.client?.name ?? "N/A",
        Valor: d.value ?? "0",
        Estagio: d.stageId,
        DataCriacao: d.createdAt.toISOString()
    }));

    return convertToCSV(flatData);
}

export async function exportTicketsCSV(from?: Date, to?: Date) {
    const agencyId = await getActiveAgencyIdOrThrow();

    const filters = [eq(tickets.agencyId, agencyId)];
    if (from) filters.push(gte(tickets.createdAt, from));
    if (to) filters.push(lte(tickets.createdAt, to));

    const result = await db.query.tickets.findMany({
        where: and(...filters)
    });

    const flatData = result.map(t => ({
        ID: t.id,
        Assunto: t.subject,
        Status: t.status,
        Prioridade: t.priority,
        DataCriacao: t.createdAt.toISOString(),
        ResolvidoEm: t.resolvedAt?.toISOString() ?? ""
    }));

    return convertToCSV(flatData);
}
