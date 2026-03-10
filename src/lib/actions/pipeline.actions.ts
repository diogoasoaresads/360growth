"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { pipelines, pipelineStages, clients } from "@/lib/db/schema";
import { eq, and, asc } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getActiveAgencyIdOrThrow } from "@/lib/active-context";

export type PipelineTemplate = "COMERCIAL" | "AGENCY" | "SUPPORT";

const TEMPLATES: Record<PipelineTemplate, { name: string; stages: { name: string; color: string; orderIndex: number }[] }> = {
    COMERCIAL: {
        name: "Pipeline Comercial",
        stages: [
            { name: "Lead", color: "#94a3b8", orderIndex: 0 },
            { name: "Qualificado", color: "#3b82f6", orderIndex: 1 },
            { name: "Reunião", color: "#8b5cf6", orderIndex: 2 },
            { name: "Proposta", color: "#f59e0b", orderIndex: 3 },
            { name: "Negociação", color: "#06b6d4", orderIndex: 4 },
            { name: "Ganho", color: "#10b981", orderIndex: 5 },
            { name: "Perdido", color: "#ef4444", orderIndex: 6 },
        ],
    },
    AGENCY: {
        name: "Pipeline Agência",
        stages: [
            { name: "Lead", color: "#94a3b8", orderIndex: 0 },
            { name: "Diagnóstico", color: "#3b82f6", orderIndex: 1 },
            { name: "Proposta", color: "#f59e0b", orderIndex: 2 },
            { name: "Alinhamento", color: "#8b5cf6", orderIndex: 3 },
            { name: "Fechado", color: "#10b981", orderIndex: 4 },
            { name: "Perdido", color: "#ef4444", orderIndex: 5 },
        ],
    },
    SUPPORT: {
        name: "Pipeline Suporte/Onboarding",
        stages: [
            { name: "Novo", color: "#3b82f6", orderIndex: 0 },
            { name: "Em análise", color: "#f59e0b", orderIndex: 1 },
            { name: "Em execução", color: "#06b6d4", orderIndex: 2 },
            { name: "Aguardando cliente", color: "#8b5cf6", orderIndex: 3 },
            { name: "Concluído", color: "#10b981", orderIndex: 4 },
        ],
    },
};

export async function createPipeline(clientId: string, name?: string, template?: PipelineTemplate) {
    const session = await auth();
    if (!session) throw new Error("Unauthorized");

    const agencyId = await getActiveAgencyIdOrThrow();

    // Verify client belongs to this agency
    const client = await db.query.clients.findFirst({
        where: and(eq(clients.id, clientId), eq(clients.agencyId, agencyId)),
    });
    if (!client) throw new Error("Cliente não encontrado");

    const selectedTemplate = template ? TEMPLATES[template] : TEMPLATES.COMERCIAL;

    const [newPipeline] = await db.insert(pipelines).values({
        agencyId,
        clientId,
        name: name || selectedTemplate.name,
        createdBy: session.user.id,
    }).returning();

    // Create stages from template
    const stagesToCreate = selectedTemplate.stages.map(stage => ({
        pipelineId: newPipeline.id,
        name: stage.name,
        color: stage.color,
        orderIndex: stage.orderIndex,
        isClosedWon: stage.name.toLowerCase().includes("ganho") || stage.name.toLowerCase().includes("fechado") || stage.name.toLowerCase().includes("concluído"),
        isClosedLost: stage.name.toLowerCase().includes("perdido"),
    }));

    await db.insert(pipelineStages).values(stagesToCreate);

    revalidatePath("/agency/crm/pipeline");
    return newPipeline;
}

export async function getPipelines(clientId: string) {
    const agencyId = await getActiveAgencyIdOrThrow();

    return db.query.pipelines.findMany({
        where: and(eq(pipelines.agencyId, agencyId), eq(pipelines.clientId, clientId)),
        with: {
            stages: {
                orderBy: [asc(pipelineStages.orderIndex)]
            }
        }
    });
}

export async function updatePipeline(id: string, data: Partial<typeof pipelines.$inferInsert>) {
    const agencyId = await getActiveAgencyIdOrThrow();

    const [updated] = await db.update(pipelines)
        .set({ ...data, updatedAt: new Date() })
        .where(and(eq(pipelines.id, id), eq(pipelines.agencyId, agencyId)))
        .returning();

    revalidatePath("/agency/crm/pipeline");
    return updated;
}
