"use server";

import { db } from "@/lib/db";
import { dealMessages, messageTemplates, deals } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { getActiveAgencyIdOrThrow } from "@/lib/active-context";

export interface SendMessageProps {
    dealId: string;
    channel: "whatsapp" | "email";
    content: string;
    templateId?: string;
}

/**
 * Substitui variáveis dinâmicas no conteúdo da mensagem.
 */
async function parseTemplate(content: string, dealId: string) {
    const deal = await db.query.deals.findFirst({
        where: eq(deals.id, dealId),
        with: {
            client: true,
            responsible: true,
        },
    });

    if (!deal) return content;

    let parsed = content;
    const vars: Record<string, string> = {
        "{{nome}}": deal.client?.name || "Cliente",
        "{{empresa}}": deal.companyName || deal.client?.company || "sua empresa",
        "{{valor_proposta}}": deal.value ? Number(deal.value).toLocaleString("pt-BR", { style: "currency", currency: "BRL" }) : "R$ 0,00",
        "{{responsavel}}": deal.responsible?.name || "Consultor",
    };

    Object.entries(vars).forEach(([key, value]) => {
        parsed = parsed.replace(new RegExp(key, "g"), value);
    });

    return parsed;
}

export async function sendCRMMessage({ dealId, channel, content }: SendMessageProps) {
    const agencyId = await getActiveAgencyIdOrThrow();

    // 1. Parsear variáveis
    const finalContent = await parseTemplate(content, dealId);

    // 2. Simular Envio Externo (Log ou API Mock)
    console.log(`[CRM Message] Sending ${channel} to Deal ${dealId}:`, finalContent);

    // 3. Registrar no Histórico
    const [newMessage] = await db.insert(dealMessages).values({
        dealId,
        channel,
        direction: "OUTBOUND",
        message: finalContent,
        status: "SENT",
        sentAt: new Date(),
    }).returning();

    return newMessage;
}

export async function getDealMessages(dealId: string) {
    return await db.query.dealMessages.findMany({
        where: eq(dealMessages.dealId, dealId),
        orderBy: [desc(dealMessages.sentAt)],
    });
}

export async function getTemplatesByChannel(channel: string) {
    return await db.query.messageTemplates.findMany({
        where: eq(messageTemplates.channel, channel),
    });
}
