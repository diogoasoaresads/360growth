import type { Deal, PipelineStage } from "@/lib/db/schema";
import { differenceInDays } from "date-fns";

export interface DealScoreInput extends Deal {
    stage?: PipelineStage | null;
}

/**
 * Calcula o score de um deal (0 a 100) baseado em múltiplos fatores.
 */
export function calculateDealScore(deal: DealScoreInput): number {
    let score = 50; // Score base inicial

    // 1. Origem do Lead (Marketing context)
    if (deal.utmSource?.toLowerCase().includes("google") || deal.leadSource?.toLowerCase().includes("google")) {
        score += 20;
    } else if (deal.utmSource?.toLowerCase().includes("meta") || deal.utmSource?.toLowerCase().includes("facebook")) {
        score += 15;
    }

    // 2. Valor do Negócio
    const value = deal.value ? Number(deal.value) : 0;
    if (value > 100000) score += 25;
    else if (value > 50000) score += 20;
    else if (value > 10000) score += 15;

    // 3. Etapa da Pipeline (Avanço relativo)
    if (deal.stage) {
        if (deal.stage.probability && deal.stage.probability >= 70) {
            score += 15;
        } else if (deal.stage.probability && deal.stage.probability >= 40) {
            score += 5;
        }
    }

    // 4. Tempo Parado (Aging)
    const lastActivity = deal.lastActivityAt || deal.updatedAt;
    const daysParado = differenceInDays(new Date(), new Date(lastActivity));

    if (daysParado > 15) score -= 30;
    else if (daysParado > 7) score -= 20;
    else if (daysParado < 2) score += 5;

    // 5. SLA por Etapa (se implementado)
    if (deal.stage?.slaDays && daysParado > deal.stage.slaDays) {
        score -= 15;
    }

    // 6. Próxima Ação
    if (!deal.nextActionDate) {
        score -= 10;
    } else {
        const daysToNextAction = differenceInDays(new Date(deal.nextActionDate), new Date());
        if (daysToNextAction < 0) score -= 15; // Próxima ação atrasada
        else if (daysToNextAction === 0) score += 10; // Próxima ação é hoje
    }

    // 7. Proximidade do Fechamento
    if (deal.expectedCloseDate) {
        const daysToClose = differenceInDays(new Date(deal.expectedCloseDate), new Date());
        if (daysToClose >= 0 && daysToClose <= 7) score += 15; // Fechamento próximo
        else if (daysToClose < 0) score -= 20; // Data de fechamento vencida
    }

    // Garantir limites 0-100
    return Math.min(Math.max(score, 0), 100);
}

/**
 * Retorna o label visual de prioridade com base no score.
 */
export function getPriorityLabel(score: number): { label: string; color: string; icon: "Flame" | "AlertTriangle" | "Moon" } {
    if (score >= 80) return { label: "Alta Prioridade", color: "bg-red-500", icon: "Flame" };
    if (score >= 50) return { label: "Média Prioridade", color: "bg-amber-500", icon: "AlertTriangle" };
    return { label: "Baixa Prioridade", color: "bg-blue-500", icon: "Moon" };
}

/**
 * Gera insights automáticos simples com base no estado do deal.
 */
export function getDealInsights(deal: DealScoreInput): string[] {
    const insights: string[] = [];
    const daysParado = differenceInDays(new Date(), new Date(deal.lastActivityAt || deal.updatedAt));

    if (daysParado > 7) insights.push(`Negócio parado há ${daysParado} dias. Agende um follow-up.`);
    if (!deal.nextActionDate) insights.push("Sem próxima ação definida. Risco de perda de momentum.");
    if (deal.value && Number(deal.value) > 50000 && (deal.dealScore || 0) < 50) insights.push("Negócio de alto valor com score baixo. Atenção redobrada.");
    if (deal.utmSource === "google-ads" && deal.status === "OPEN") insights.push("Lead originado por Google Ads. Alta probabilidade de conversão identificada historicamente.");

    return insights;
}

interface ChannelMetric {
    channel: string;
    revenue: number;
    deals: number;
}

/**
 * Gera insights globais para o dashboard com base em métricas agregadas.
 */
export function getGlobalInsights(
    metrics: { conversionRate: number, totalValue: number, totalDeals: number, avgCycleDays: number },
    channelData: ChannelMetric[]
): string[] {
    const globalInsights: string[] = [];

    // Insight de Conversão Geral
    if (metrics.conversionRate < 10) {
        globalInsights.push("Taxa de conversão geral abaixo da média (10%). Considere revisar a qualificação de leads.");
    }

    // Insight de Canal
    const topChannel = [...channelData].sort((a, b) => b.revenue - a.revenue)[0];
    if (topChannel && topChannel.revenue > 0) {
        globalInsights.push(`O canal ${topChannel.channel} é o seu maior gerador de receita. Considere aumentar o investimento.`);
    }

    // Insight de Ticket Médio
    const channelsWithHighTicket = channelData.filter(c => c.avgTicket > metrics.totalValue / (metrics.totalDeals || 1));
    if (channelsWithHighTicket.length > 0) {
        globalInsights.push(`${channelsWithHighTicket[0].channel} possui um ticket médio superior à média geral.`);
    }

    // Insight de Ciclo de Vendas
    if (metrics.avgCycleDays > 30) {
        globalInsights.push("Ciclo de vendas superior a 30 dias. Identificamos gargalos potenciais nas etapas de Proposta/Negociação.");
    }

    return globalInsights;
}
