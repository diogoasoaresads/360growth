import { db } from "@/lib/db";
import { automationWorkflows, tasks, notifications, dealAutomationRules, deals } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import type { AutomationTrigger, TicketPriority } from "@/lib/db/schema";
import { sendSystemEmail } from "@/lib/messaging/email";
import { sendCRMMessage } from "@/lib/actions/crm-messenger.actions";

/**
 * The Workflow Engine processes system events and executes matching automation rules.
 */
export async function processWorkflowEvent(
    agencyId: string,
    event: AutomationTrigger,
    data: {
        entityId: string;
        entityType: "DEAL" | "TICKET";
        currentValue?: string; // e.g., the new stage or status
        metadata?: Record<string, unknown>;
    }
) {
    try {
        // 1. Fetch active workflows for this agency and event
        const activeWorkflows = await db.query.automationWorkflows.findMany({
            where: and(
                eq(automationWorkflows.agencyId, agencyId),
                eq(automationWorkflows.triggerEvent, event),
                eq(automationWorkflows.isActive, true)
            ),
        });

        if (activeWorkflows.length === 0) return;

        for (const workflow of activeWorkflows) {
            // 2. Critical: Check conditions (e.g., "if stage is CLOSED_WON")
            const conditions = workflow.triggerConditions as Record<string, unknown> || {};
            let match = true;

            if (conditions.stage && data.currentValue !== conditions.stage) match = false;
            if (conditions.status && data.currentValue !== conditions.status) match = false;
            if (conditions.priority && data.metadata?.priority !== conditions.priority) match = false;

            if (!match) continue;

            // 3. Execute Actions
            for (const action of workflow.actions) {
                const payload = action.payload as Record<string, unknown>;
                switch (action.type) {
                    case "CREATE_TASK":
                        await db.insert(tasks).values({
                            agencyId,
                            title: (payload.title as string) || "Tarefa Automática",
                            description: (payload.description as string) || `Gerada via workflow: ${workflow.name}`,
                            status: "PENDING",
                            priority: (payload.priority as TicketPriority) || "MEDIUM",
                            entityType: data.entityType,
                            entityId: data.entityId,
                            dueDate: payload.daysOffset
                                ? new Date(Date.now() + Number(payload.daysOffset) * 24 * 60 * 60 * 1000)
                                : null,
                            responsibleId: (payload.responsibleId as string) || null,
                        });
                        break;

                    case "SEND_NOTIFICATION":
                        // Notification to the responsible or a specific user
                        const targetUserId = (payload.userId as string) || (data.metadata?.ownerId as string);
                        if (targetUserId) {
                            await db.insert(notifications).values({
                                userId: targetUserId,
                                agencyId,
                                title: (payload.title as string) || "Alerta de Automação",
                                message: (payload.message as string) || `O evento ${event} disparou uma regra.`,
                                type: data.entityType,
                                link: data.entityType === "DEAL"
                                    ? `/agency/crm/pipeline?dealId=${data.entityId}`
                                    : `/agency/tickets/${data.entityId}`,
                            });
                        }
                        break;

                    case "SEND_EMAIL":
                        // Real Email integration via Resend
                        if (action.payload.to || data.metadata?.email) {
                            const recipient = (action.payload.to as string) || (data.metadata?.email as string);
                            await sendSystemEmail({
                                to: recipient,
                                templateKey: (action.payload.templateKey as string) || "DEFAULT_NOTIFICATION",
                                agencyId,
                                variables: {
                                    ...(data.metadata as Record<string, string>),
                                    entityId: data.entityId,
                                    event: event,
                                },
                            });
                        }
                        break;

                    case "SEND_WHATSAPP":
                        if (data.entityType === "DEAL") {
                            await sendCRMMessage({
                                dealId: data.entityId,
                                channel: "whatsapp",
                                content: (payload.message as string) || "Olá! Recebemos seu interesse.",
                            });
                        }
                        break;

                    case "MOVE_STAGE":
                        if (data.entityType === "DEAL" && payload.stageId) {
                            await db.update(deals).set({
                                stageId: payload.stageId as string,
                                updatedAt: new Date(),
                            }).where(eq(deals.id, data.entityId));
                        }
                        break;
                }
            }
        }

        // 4. CRM Phase 4: Extended Deal Automation Rules (Direct Rules)
        const isDealTrigger = ["DEAL_CREATED", "DEAL_STAGE_CHANGED", "SLA_BREACHED", "DEAL_IDLE"].includes(event);
        if (data.entityType === "DEAL" && isDealTrigger) {
            const dealRules = await db.query.dealAutomationRules.findMany({
                where: and(
                    eq(dealAutomationRules.agencyId, agencyId),
                    event === "DEAL_STAGE_CHANGED"
                        ? eq(dealAutomationRules.triggerStageId, data.currentValue!)
                        : eq(dealAutomationRules.triggerEvent, event),
                    eq(dealAutomationRules.isActive, true)
                ),
            });

            for (const rule of dealRules) {
                const payload = rule.actionPayload as Record<string, unknown>;
                const delayMs = (rule.delayHours || 0) * 60 * 60 * 1000 + (rule.delayDays || 0) * 24 * 60 * 60 * 1000;

                // Simple Simulation of Delay (In production use a Queue/Scheduler)
                if (delayMs > 0) {
                    console.log(`[Workflow] Delaying action for ${delayMs}ms for Deal ${data.entityId}`);
                    // setTimeout would only work in some serverless environments if not long-running. 
                    // For now, we execute directly as a proof of concept.
                }

                switch (rule.actionType) {
                    case "CREATE_TASK":
                        await db.insert(tasks).values({
                            agencyId,
                            title: (payload.title as string) || "Tarefa Automática de Follow-up",
                            description: (payload.description as string) || "Gerada automaticamente pela regra.",
                            status: "PENDING",
                            priority: "MEDIUM",
                            entityType: "DEAL",
                            entityId: data.entityId,
                            dueDate: new Date(Date.now() + delayMs),
                        });
                        break;

                    case "SEND_WHATSAPP":
                        await sendCRMMessage({
                            dealId: data.entityId,
                            channel: "whatsapp",
                            content: (payload.message as string) || "Olá!",
                        });
                        break;

                    case "SEND_NOTIFICATION":
                        await db.insert(notifications).values({
                            userId: (data.metadata?.ownerId as string) || agencyId, // fallback to agency admin
                            agencyId,
                            title: (payload.title as string) || "Alerta de Automação CRM",
                            message: (payload.message as string) || `O evento ${event} disparou uma regra.`,
                            type: "DEAL",
                            link: `/agency/crm/pipeline?dealId=${data.entityId}`,
                        });
                        break;
                }
            }
        }
    } catch (error) {
        console.error("[WorkflowEngine] Error processing event:", error);
    }
}
