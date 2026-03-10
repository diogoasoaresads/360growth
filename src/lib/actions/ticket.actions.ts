"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { tickets, ticketMessages, activities, agencyUsers } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { createNotification } from "./notification.actions";
import {
  createTicketSchema,
  updateTicketSchema,
  addTicketMessageSchema,
} from "@/lib/validations/ticket";
import type {
  CreateTicketInput,
  UpdateTicketInput,
  AddTicketMessageInput,
} from "@/lib/validations/ticket";
import { validatePlanLimit } from "@/lib/usage/agency-usage";
import { getActiveAgencyIdOrThrow } from "@/lib/active-context";
import { isFeatureEnabled } from "@/lib/feature-flags/agency-flags";
import { processWorkflowEvent } from "../automation/workflow-engine";

export async function createTicket(input: CreateTicketInput) {
  const session = await auth();
  if (!session) throw new Error("Unauthorized");
  const agencyId = await getActiveAgencyIdOrThrow();

  if (!await isFeatureEnabled(agencyId, "tickets_enabled")) {
    throw new Error("Módulo de tickets está desabilitado para esta agência.");
  }

  const parsed = createTicketSchema.safeParse(input);
  if (!parsed.success) throw new Error("Dados inválidos");

  await validatePlanLimit({ agencyId, actorUserId: session.user.id, resourceType: "tickets", context: { action: "createTicket" } });

  const { message, ...ticketData } = parsed.data;

  const [ticket] = await db
    .insert(tickets)
    .values({
      ...ticketData,
      agencyId,
      createdBy: session.user.id,
    })
    .returning();

  await db.insert(ticketMessages).values({
    ticketId: ticket.id,
    userId: session.user.id,
    content: message,
    isInternal: false,
  });

  await db.insert(activities).values({
    agencyId,
    entityType: "TICKET",
    entityId: ticket.id,
    userId: session.user.id,
    type: "NOTE",
    description: `Ticket criado: ${ticket.subject}`,
  });

  // Notify Agency Team
  const team = await db.query.agencyUsers.findMany({
    where: eq(agencyUsers.agencyId, agencyId),
  });

  for (const member of team) {
    if (member.userId !== session.user.id) {
      await createNotification({
        userId: member.userId,
        agencyId,
        title: "Novo Ticket",
        message: `${session.user.name} criou um novo ticket: ${ticket.subject}`,
        type: "TICKET",
        link: `/agency/tickets/${ticket.id}`,
      });
    }
  }

  revalidatePath("/agency/tickets");
  revalidatePath("/portal/tickets");

  // Trigger Automations
  await processWorkflowEvent(agencyId, "TICKET_CREATED", {
    entityId: ticket.id,
    entityType: "TICKET",
    metadata: { priority: ticketData.priority },
  });

  return ticket;
}

export async function updateTicketStatus(id: string, input: UpdateTicketInput) {
  const session = await auth();
  if (!session) throw new Error("Unauthorized");
  const agencyId = await getActiveAgencyIdOrThrow();

  const parsed = updateTicketSchema.safeParse(input);
  if (!parsed.success) throw new Error("Dados inválidos");

  const updateData: Record<string, unknown> = {
    ...parsed.data,
    updatedAt: new Date(),
  };

  if (parsed.data.status === "RESOLVED") {
    updateData.resolvedAt = new Date();
  }

  const [ticket] = await db
    .update(tickets)
    .set(updateData)
    .where(and(eq(tickets.id, id), eq(tickets.agencyId, agencyId)))
    .returning();

  if (parsed.data.status) {
    await db.insert(activities).values({
      agencyId,
      entityType: "TICKET",
      entityId: id,
      userId: session.user.id,
      type: "STATUS_CHANGE",
      description: `Status alterado para: ${parsed.data.status}`,
    });
  }

  // Notify Client and Assigned User
  const [ticketDetails] = await db.select().from(tickets).where(eq(tickets.id, id));
  if (ticketDetails) {
    const notifyUsers = new Set([ticketDetails.createdBy, ticketDetails.assignedTo].filter(Boolean) as string[]);
    await Promise.all(
      Array.from(notifyUsers).map(async (userId) => {
        if (userId !== session.user.id) {
          await createNotification({
            userId,
            agencyId,
            title: "Atualização de Ticket",
            message: `O status do ticket "${ticketDetails.subject}" foi alterado para ${parsed.data.status || ticketDetails.status}`,
            type: "TICKET",
            link: userId === ticketDetails.createdBy ? `/portal/tickets/${id}` : `/agency/tickets/${id}`,
          });
        }
      })
    );
  }

  // Trigger Automations
  if (parsed.data.status) {
    await processWorkflowEvent(agencyId, "TICKET_STATUS_CHANGED", {
      entityId: id,
      entityType: "TICKET",
      currentValue: parsed.data.status,
    });
  }

  revalidatePath("/agency/tickets");
  return ticket;
}

export async function addTicketMessage(ticketId: string, input: AddTicketMessageInput) {
  const session = await auth();
  if (!session) throw new Error("Unauthorized");
  const agencyId = await getActiveAgencyIdOrThrow();

  const parsed = addTicketMessageSchema.safeParse(input);
  if (!parsed.success) throw new Error("Dados inválidos");

  // Verify ticket belongs to this agency
  const ticket = await db.query.tickets.findFirst({
    where: and(eq(tickets.id, ticketId), eq(tickets.agencyId, agencyId)),
  });
  if (!ticket) throw new Error("Ticket não encontrado");

  const [message] = await db
    .insert(ticketMessages)
    .values({
      ticketId,
      userId: session.user.id,
      content: parsed.data.content,
      isInternal: parsed.data.isInternal,
    })
    .returning();

  // Update ticket updatedAt
  await db
    .update(tickets)
    .set({ updatedAt: new Date() })
    .where(eq(tickets.id, ticketId));

  // Notify other party
  if (ticket) {
    const isAgencySide = session.user.role !== "CLIENT";
    const recipientId = isAgencySide ? ticket.createdBy : ticket.assignedTo;

    if (recipientId && recipientId !== session.user.id) {
      await createNotification({
        userId: recipientId,
        agencyId: ticket.agencyId,
        title: "Nova Mensagem",
        message: `${session.user.name} respondeu ao ticket: ${ticket.subject}`,
        type: "TICKET",
        link: isAgencySide ? `/portal/tickets/${ticketId}` : `/agency/tickets/${ticketId}`,
      });
    }
  }

  revalidatePath(`/agency/tickets/${ticketId}`);
  revalidatePath(`/portal/tickets/${ticketId}`);
  return message;
}
