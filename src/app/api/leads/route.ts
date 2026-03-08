import { db } from "@/lib/db";
import { deals, clients, leadSources } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { NextResponse } from "next/server";
import { processWorkflowEvent } from "@/lib/automation/workflow-engine";

/**
 * Ingestão de Leads Externos (Webhook)
 * POST /api/leads
 */
export async function POST(req: Request) {
    try {
        const body = await req.json();
        const {
            agencyId,
            nome,
            email,
            telefone,
            empresa,
            utmSource,
            utmMedium,
            utmCampaign,
            leadSource
        } = body;

        if (!agencyId || !email) {
            return NextResponse.json({ error: "Missing required fields (agencyId, email)" }, { status: 400 });
        }

        // 1. Garantir ou buscar Cliente
        let client = await db.query.clients.findFirst({
            where: and(eq(clients.agencyId, agencyId), eq(clients.email, email))
        });

        if (!client) {
            [client] = await db.insert(clients).values({
                agencyId,
                name: nome,
                email,
                phone: telefone,
                company: empresa,
            }).returning();
        }

        // 2. Registrar Fonte do Lead
        await db.insert(leadSources).values({
            agencyId,
            source: utmSource || leadSource || "direct",
            medium: utmMedium,
            campaign: utmCampaign,
        });

        // 3. Criar Deal Automático
        const [deal] = await db.insert(deals).values({
            agencyId,
            clientId: client.id,
            title: `Novo Lead: ${nome} - ${empresa || 'Individual'}`,
            status: "OPEN",
            leadSource: leadSource || utmSource,
            utmSource,
            utmMedium,
            utmCampaign,
            value: "0",
        }).returning();

        // 4. Disparar Automação
        await processWorkflowEvent(agencyId, "DEAL_CREATED", {
            entityId: deal.id,
            entityType: "DEAL",
            currentValue: "NEW",
            metadata: {
                email,
                name: nome,
                source: utmSource || leadSource
            }
        });

        return NextResponse.json({
            success: true,
            dealId: deal.id,
            message: "Lead ingressado e Deal criado com sucesso."
        });

    } catch (error) {
        console.error("[Lead Ingestion Error]", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
