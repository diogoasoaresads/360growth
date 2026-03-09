"use server";

import { db } from "@/lib/db";
import { deals, activities, dealMessages } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";

/**
 * Gera um resumo executivo do negócio baseado em atividades e mensagens.
 * (Simulação de IA - Em produção integraria com OpenAI/Gemini)
 */
export async function generateDealAISummary(dealId: string) {
    const deal = await db.query.deals.findFirst({
        where: eq(deals.id, dealId),
        with: {
            activities: {
                orderBy: [desc(activities.createdAt)],
                limit: 5
            }
        }
    });

    if (!deal) return null;

    const messages = await db.query.dealMessages.findMany({
        where: eq(dealMessages.dealId, dealId),
        orderBy: [desc(dealMessages.sentAt)],
        limit: 5
    });

    // Lógica de "IA" (Heurística avançada para o protótipo)
    let summary = `Negócio "${deal.title}" `;
    if (messages.length > 0) {
        summary += `teve comunicação recente via ${messages[0].channel}. `;
    } else {
        summary += `ainda não possui interação direta registrada. `;
    }

    if (deal.activities.length > 0) {
        summary += `A última atividade foi "${deal.activities[0].description}". `;
    }

    const value = Number(deal.value || 0);
    if (value > 50000) {
        summary += `Trata-se de uma oportunidade de alto ticket, exigindo acompanhamento sênior. `;
    }

    // Salvar no banco
    await db.update(deals).set({
        dealSummary: summary,
        updatedAt: new Date()
    }).where(eq(deals.id, dealId));

    return summary;
}

/**
 * Calcula o nível de risco de perda do negócio.
 */
export async function calculateDealRisk(dealId: string) {
    const deal = await db.query.deals.findFirst({
        where: eq(deals.id, dealId),
    });

    if (!deal) return "LOW";

    let risk: "LOW" | "MEDIUM" | "HIGH" = "LOW";
    const now = new Date();
    const updatedAt = new Date(deal.updatedAt);
    const diffDays = Math.floor((now.getTime() - updatedAt.getTime()) / (1000 * 3600 * 24));

    // Regras de Risco
    if (diffDays > 15 && deal.status === 'OPEN') risk = "HIGH";
    else if (diffDays > 7) risk = "MEDIUM";

    if (!deal.nextActionDate && deal.status === 'OPEN') risk = "HIGH";

    await db.update(deals).set({
        dealRiskLevel: risk,
        updatedAt: new Date()
    }).where(eq(deals.id, dealId));

    return risk;
}
