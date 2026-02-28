"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { tickets, ticketMessages, activities } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";
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

export async function createTicket(input: CreateTicketInput) {
  const session = await auth();
  if (!session) throw new Error("Unauthorized");
  const agencyId = await getActiveAgencyIdOrThrow();

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

  revalidatePath("/agency/tickets");
  revalidatePath("/portal/tickets");
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

  revalidatePath("/agency/tickets");
  return ticket;
}

export async function addTicketMessage(ticketId: string, input: AddTicketMessageInput) {
  const session = await auth();
  if (!session) throw new Error("Unauthorized");

  const parsed = addTicketMessageSchema.safeParse(input);
  if (!parsed.success) throw new Error("Dados inválidos");

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

  revalidatePath(`/agency/tickets/${ticketId}`);
  revalidatePath(`/portal/tickets/${ticketId}`);
  return message;
}
