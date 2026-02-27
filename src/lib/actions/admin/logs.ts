"use server";

import { db } from "@/lib/db";
import { auditLogs, users, agencies } from "@/lib/db/schema";
import { auth } from "@/lib/auth";
import {
  eq,
  desc,
  asc,
  count,
  ilike,
  and,
  gte,
  lte,
  inArray,
  or,
} from "drizzle-orm";
import type { ActionResult } from "@/lib/types";

async function requireSuperAdmin() {
  const session = await auth();
  if (!session || session.user.role !== "SUPER_ADMIN") {
    throw new Error("Não autorizado");
  }
  return session;
}

export interface AuditLogEntry {
  id: string;
  action: string;
  entityType: string | null;
  entityId: string | null;
  agencyId: string | null;
  agencyName: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: Date;
  user: {
    id: string;
    name: string | null;
    email: string | null;
    image: string | null;
  } | null;
}

export interface AuditLogsParams {
  page?: number;
  perPage?: number;
  search?: string;
  actions?: string[];
  entityType?: string;
  agencyId?: string;
  actorUserId?: string;
  dateFrom?: string;
  dateTo?: string;
  sortOrder?: "asc" | "desc";
}

export interface AuditLogsResult {
  data: AuditLogEntry[];
  totalCount: number;
  totalPages: number;
}

export async function getAuditLogs(
  params: AuditLogsParams = {}
): Promise<ActionResult<AuditLogsResult>> {
  try {
    await requireSuperAdmin();

    const {
      page = 1,
      perPage = 25,
      search,
      actions,
      entityType,
      agencyId,
      actorUserId,
      dateFrom,
      dateTo,
      sortOrder = "desc",
    } = params;
    const offset = (page - 1) * perPage;

    const conditions = [];

    if (search) {
      conditions.push(
        or(
          ilike(users.name, `%${search}%`),
          ilike(users.email, `%${search}%`),
          ilike(auditLogs.entityId, `%${search}%`)
        )
      );
    }

    if (actions && actions.length > 0) {
      conditions.push(inArray(auditLogs.action, actions));
    }

    if (dateFrom) {
      const from = new Date(dateFrom);
      if (!isNaN(from.getTime())) {
        conditions.push(gte(auditLogs.createdAt, from));
      }
    }

    if (dateTo) {
      const to = new Date(dateTo);
      if (!isNaN(to.getTime())) {
        to.setHours(23, 59, 59, 999);
        conditions.push(lte(auditLogs.createdAt, to));
      }
    }

    if (entityType) {
      conditions.push(eq(auditLogs.entityType, entityType as import("@/lib/db/schema").EntityType));
    }

    if (agencyId) {
      conditions.push(eq(auditLogs.agencyId, agencyId));
    }

    if (actorUserId) {
      conditions.push(eq(auditLogs.userId, actorUserId));
    }

    const where = conditions.length > 0 ? and(...conditions) : undefined;

    const orderFn = sortOrder === "asc" ? asc : desc;

    const [rows, [{ total }]] = await Promise.all([
      db
        .select({
          log: auditLogs,
          userName: users.name,
          userEmail: users.email,
          userImage: users.image,
          userId: users.id,
          agencyName: agencies.name,
        })
        .from(auditLogs)
        .leftJoin(users, eq(users.id, auditLogs.userId))
        .leftJoin(agencies, eq(agencies.id, auditLogs.agencyId))
        .where(where)
        .orderBy(orderFn(auditLogs.createdAt))
        .limit(perPage)
        .offset(offset),

      db
        .select({ total: count() })
        .from(auditLogs)
        .leftJoin(users, eq(users.id, auditLogs.userId))
        .leftJoin(agencies, eq(agencies.id, auditLogs.agencyId))
        .where(where),
    ]);

    const data: AuditLogEntry[] = rows.map((r) => ({
      id: r.log.id,
      action: r.log.action,
      entityType: r.log.entityType ?? null,
      entityId: r.log.entityId ?? null,
      agencyId: r.log.agencyId ?? null,
      agencyName: r.agencyName ?? null,
      ipAddress: r.log.ipAddress ?? null,
      userAgent: r.log.userAgent ?? null,
      metadata: r.log.metadata as Record<string, unknown> | null,
      createdAt: r.log.createdAt,
      user: r.userId
        ? { id: r.userId, name: r.userName, email: r.userEmail, image: r.userImage }
        : null,
    }));

    return {
      success: true,
      data: {
        data,
        totalCount: total,
        totalPages: Math.ceil(total / perPage),
      },
    };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Erro ao buscar logs",
    };
  }
}
