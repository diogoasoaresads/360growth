"use server";

import { db } from "@/lib/db";
import {
  tickets,
  ticketMessages,
  agencies,
  users,
  plans,
  auditLogs,
} from "@/lib/db/schema";
import { auth } from "@/lib/auth";
import {
  eq,
  and,
  ilike,
  count,
  desc,
  asc,
} from "drizzle-orm";
import { revalidatePath } from "next/cache";
import type { ActionResult } from "@/lib/types";
import type {
  Ticket,
  TicketMessage,
  TicketStatus,
  TicketPriority,
  Agency,
  Plan,
} from "@/lib/db/schema";

async function requireSuperAdmin() {
  const session = await auth();
  if (!session || session.user.role !== "SUPER_ADMIN") {
    throw new Error("Não autorizado");
  }
  return session;
}

// ─────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────

export interface TicketWithAgency extends Ticket {
  agency: Pick<Agency, "id" | "name" | "agencyStatus"> | null;
  plan: Pick<Plan, "name" | "slug"> | null;
  creatorName: string | null;
  creatorEmail: string | null;
}

export interface TicketMessageWithUser extends TicketMessage {
  userName: string | null;
  userEmail: string | null;
  userImage: string | null;
  userRole: string | null;
}

export interface TicketDetail extends TicketWithAgency {
  messages: TicketMessageWithUser[];
}

export interface TicketsListParams {
  page?: number;
  perPage?: number;
  search?: string;
  status?: string;
  priority?: string;
  agencyId?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export interface TicketsListResult {
  data: TicketWithAgency[];
  totalCount: number;
  totalPages: number;
  statusCounts: Record<TicketStatus, number>;
}

// ─────────────────────────────────────────────────────────
// GET TICKETS LIST
// ─────────────────────────────────────────────────────────

export async function getAdminTickets(
  params: TicketsListParams = {}
): Promise<ActionResult<TicketsListResult>> {
  try {
    await requireSuperAdmin();

    const {
      page = 1,
      perPage = 25,
      search,
      status,
      priority,
      agencyId,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = params;
    const offset = (page - 1) * perPage;

    const conditions = [];
    if (search) {
      conditions.push(ilike(tickets.subject, `%${search}%`));
    }
    if (status) {
      conditions.push(eq(tickets.status, status as TicketStatus));
    }
    if (priority) {
      conditions.push(eq(tickets.priority, priority as TicketPriority));
    }
    if (agencyId) {
      conditions.push(eq(tickets.agencyId, agencyId));
    }

    const where = conditions.length > 0 ? and(...conditions) : undefined;

    const orderCol =
      sortBy === "subject"
        ? tickets.subject
        : sortBy === "priority"
        ? tickets.priority
        : sortBy === "status"
        ? tickets.status
        : sortBy === "updatedAt"
        ? tickets.updatedAt
        : tickets.createdAt;

    const orderFn = sortOrder === "asc" ? asc : desc;

    const [rows, [{ total }], statusRows] = await Promise.all([
      db
        .select({
          ticket: tickets,
          agencyId: agencies.id,
          agencyName: agencies.name,
          agencyStatus: agencies.agencyStatus,
          planName: plans.name,
          planSlug: plans.slug,
          creatorName: users.name,
          creatorEmail: users.email,
        })
        .from(tickets)
        .leftJoin(agencies, eq(agencies.id, tickets.agencyId))
        .leftJoin(plans, eq(plans.id, agencies.planId))
        .leftJoin(users, eq(users.id, tickets.createdBy))
        .where(where)
        .orderBy(orderFn(orderCol))
        .limit(perPage)
        .offset(offset),

      db.select({ total: count() }).from(tickets).where(where),

      // Status counts (all tickets, no filters)
      db
        .select({ status: tickets.status, total: count() })
        .from(tickets)
        .groupBy(tickets.status),
    ]);

    const data: TicketWithAgency[] = rows.map((r) => ({
      ...r.ticket,
      agency: r.agencyId
        ? { id: r.agencyId, name: r.agencyName!, agencyStatus: r.agencyStatus! }
        : null,
      plan: r.planName ? { name: r.planName, slug: r.planSlug } : null,
      creatorName: r.creatorName,
      creatorEmail: r.creatorEmail,
    }));

    const statusCounts = statusRows.reduce(
      (acc, row) => {
        acc[row.status] = row.total;
        return acc;
      },
      {} as Record<TicketStatus, number>
    );

    return {
      success: true,
      data: {
        data,
        totalCount: total,
        totalPages: Math.ceil(total / perPage),
        statusCounts,
      },
    };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Erro ao buscar tickets" };
  }
}

// ─────────────────────────────────────────────────────────
// GET TICKET BY ID
// ─────────────────────────────────────────────────────────

export async function getAdminTicketById(
  ticketId: string
): Promise<ActionResult<TicketDetail>> {
  try {
    await requireSuperAdmin();

    const [row] = await db
      .select({
        ticket: tickets,
        agencyId: agencies.id,
        agencyName: agencies.name,
        agencyStatus: agencies.agencyStatus,
        planName: plans.name,
        planSlug: plans.slug,
        creatorName: users.name,
        creatorEmail: users.email,
      })
      .from(tickets)
      .leftJoin(agencies, eq(agencies.id, tickets.agencyId))
      .leftJoin(plans, eq(plans.id, agencies.planId))
      .leftJoin(users, eq(users.id, tickets.createdBy))
      .where(eq(tickets.id, ticketId));

    if (!row) return { success: false, error: "Ticket não encontrado" };

    const rawMessages = await db
      .select({
        msg: ticketMessages,
        userName: users.name,
        userEmail: users.email,
        userImage: users.image,
        userRole: users.role,
      })
      .from(ticketMessages)
      .leftJoin(users, eq(users.id, ticketMessages.userId))
      .where(eq(ticketMessages.ticketId, ticketId))
      .orderBy(asc(ticketMessages.createdAt));

    const messages: TicketMessageWithUser[] = rawMessages.map((m) => ({
      ...m.msg,
      userName: m.userName,
      userEmail: m.userEmail,
      userImage: m.userImage,
      userRole: m.userRole,
    }));

    return {
      success: true,
      data: {
        ...row.ticket,
        agency: row.agencyId
          ? { id: row.agencyId, name: row.agencyName!, agencyStatus: row.agencyStatus! }
          : null,
        plan: row.planName ? { name: row.planName, slug: row.planSlug } : null,
        creatorName: row.creatorName,
        creatorEmail: row.creatorEmail,
        messages,
      },
    };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Erro ao buscar ticket" };
  }
}

// ─────────────────────────────────────────────────────────
// REPLY TO TICKET
// ─────────────────────────────────────────────────────────

export async function replyToTicket(
  ticketId: string,
  data: { content: string }
): Promise<ActionResult<TicketMessageWithUser>> {
  try {
    const session = await requireSuperAdmin();

    const content = data.content.trim();
    if (!content) return { success: false, error: "Conteúdo não pode ser vazio" };
    if (content.length > 5000) return { success: false, error: "Mensagem muito longa (máx 5000 caracteres)" };

    const [ticket] = await db
      .select({ id: tickets.id, status: tickets.status })
      .from(tickets)
      .where(eq(tickets.id, ticketId));

    if (!ticket) return { success: false, error: "Ticket não encontrado" };

    const [message] = await db
      .insert(ticketMessages)
      .values({
        ticketId,
        userId: session.user.id,
        content,
      })
      .returning();

    // If open, move to in_progress
    const newStatus: TicketStatus =
      ticket.status === "OPEN" ? "IN_PROGRESS" : ticket.status;

    await db
      .update(tickets)
      .set({ status: newStatus, updatedAt: new Date() })
      .where(eq(tickets.id, ticketId));

    await db.insert(auditLogs).values({
      userId: session.user.id,
      action: "ticket.replied",
      entityType: "TICKET",
      entityId: ticketId,
    });

    revalidatePath(`/admin/tickets/${ticketId}`);
    revalidatePath("/admin/tickets");

    return {
      success: true,
      data: {
        ...message,
        userName: session.user.name ?? null,
        userEmail: session.user.email ?? null,
        userImage: session.user.image ?? null,
        userRole: session.user.role,
      },
    };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Erro ao enviar resposta" };
  }
}

// ─────────────────────────────────────────────────────────
// UPDATE STATUS
// ─────────────────────────────────────────────────────────

const VALID_STATUS_TRANSITIONS: Partial<Record<TicketStatus, TicketStatus[]>> = {
  OPEN: ["IN_PROGRESS", "WAITING", "RESOLVED", "CLOSED"],
  IN_PROGRESS: ["WAITING", "RESOLVED", "CLOSED"],
  WAITING: ["IN_PROGRESS", "RESOLVED", "CLOSED"],
  RESOLVED: ["CLOSED"],
  CLOSED: [],
};

export async function updateTicketStatus(
  ticketId: string,
  status: TicketStatus
): Promise<ActionResult<void>> {
  try {
    const session = await requireSuperAdmin();

    const [ticket] = await db
      .select({ id: tickets.id, status: tickets.status })
      .from(tickets)
      .where(eq(tickets.id, ticketId));

    if (!ticket) return { success: false, error: "Ticket não encontrado" };

    const allowed = VALID_STATUS_TRANSITIONS[ticket.status] ?? [];
    if (!allowed.includes(status)) {
      return {
        success: false,
        error: `Não é possível alterar de ${ticket.status} para ${status}`,
      };
    }

    await db
      .update(tickets)
      .set({
        status,
        resolvedAt: status === "RESOLVED" || status === "CLOSED" ? new Date() : null,
        updatedAt: new Date(),
      })
      .where(eq(tickets.id, ticketId));

    await db.insert(auditLogs).values({
      userId: session.user.id,
      action: "ticket.status_changed",
      entityType: "TICKET",
      entityId: ticketId,
      metadata: { from: ticket.status, to: status },
    });

    revalidatePath(`/admin/tickets/${ticketId}`);
    revalidatePath("/admin/tickets");
    return { success: true, data: undefined };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Erro ao atualizar status" };
  }
}

// ─────────────────────────────────────────────────────────
// UPDATE PRIORITY
// ─────────────────────────────────────────────────────────

export async function updateTicketPriority(
  ticketId: string,
  priority: TicketPriority
): Promise<ActionResult<void>> {
  try {
    const session = await requireSuperAdmin();

    await db
      .update(tickets)
      .set({ priority, updatedAt: new Date() })
      .where(eq(tickets.id, ticketId));

    await db.insert(auditLogs).values({
      userId: session.user.id,
      action: "ticket.priority_changed",
      entityType: "TICKET",
      entityId: ticketId,
      metadata: { priority },
    });

    revalidatePath(`/admin/tickets/${ticketId}`);
    revalidatePath("/admin/tickets");
    return { success: true, data: undefined };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Erro ao atualizar prioridade" };
  }
}
