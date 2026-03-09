"use server";

import { db } from "@/lib/db";
import { dealMessages, messageTemplates, deals } from "@/lib/db/schema";
import { eq, desc, and } from "drizzle-orm";
import { auth } from "@/lib/auth";
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

/**
 * Internal (server-to-server) message sender — no auth check.
 * Only call from trusted server-side contexts (e.g. workflow engine).
 */
export async function sendCRMMessageInternal({ dealId, channel, content }: SendMessageProps) {
    const finalContent = await parseTemplate(content, dealId);

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

/**
 * User-facing server action — requires an authenticated session and verifies
 * that the deal belongs to the caller's agency.
 */
export async function sendCRMMessage({ dealId, channel, content, templateId }: SendMessageProps) {
    const session = await auth();
    if (!session) throw new Error("Unauthorized");
    const agencyId = await getActiveAgencyIdOrThrow();

    const deal = await db.query.deals.findFirst({
        where: and(eq(deals.id, dealId), eq(deals.agencyId, agencyId)),
    });
    if (!deal) throw new Error("Deal not found or access denied");

    return sendCRMMessageInternal({ dealId, channel, content, templateId });
}

export async function getDealMessages(dealId: string) {
    const session = await auth();
    if (!session) throw new Error("Unauthorized");
    const agencyId = await getActiveAgencyIdOrThrow();

    const deal = await db.query.deals.findFirst({
        where: and(eq(deals.id, dealId), eq(deals.agencyId, agencyId)),
    });
    if (!deal) throw new Error("Deal not found or access denied");

    return await db.query.dealMessages.findMany({
        where: eq(dealMessages.dealId, dealId),
        orderBy: [desc(dealMessages.sentAt)],
    });
}

export async function getTemplatesByChannel(channel: string) {
    const session = await auth();
    if (!session) throw new Error("Unauthorized");
    const agencyId = await getActiveAgencyIdOrThrow();

    return await db.query.messageTemplates.findMany({
        where: and(
            eq(messageTemplates.channel, channel),
            eq(messageTemplates.agencyId, agencyId)
        ),
    });
}
