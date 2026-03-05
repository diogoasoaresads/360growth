import { db } from "@/lib/db";
import { automationWorkflows, tasks, notifications } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import type { AutomationTrigger, TicketPriority } from "@/lib/db/schema";
import { sendSystemEmail } from "@/lib/messaging/email";

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
                }
            }
        }
    } catch (error) {
        console.error("[WorkflowEngine] Error processing event:", error);
    }
}
