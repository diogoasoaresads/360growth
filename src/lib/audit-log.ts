"use server";

import { db } from "@/lib/db";
import { auditLogs } from "@/lib/db/schema";
import type { EntityType } from "@/lib/db/schema";
import { headers } from "next/headers";

export type AuditAction =
  | "agency.created"
  | "agency.updated"
  | "agency.suspended"
  | "agency.reactivated"
  | "agency.deleted"
  | "user.created"
  | "user.updated"
  | "user.impersonated"
  | "user.password_reset"
  | "user.suspended"
  | "plan.updated"
  | "subscription.created"
  | "subscription.upgraded"
  | "subscription.downgraded"
  | "subscription.cancelled"
  | "ticket.created"
  | "ticket.replied"
  | "ticket.status_changed"
  | "ticket.priority_changed"
  | "ticket.closed"
  | "settings.updated"
  | "auth.login"
  | "auth.logout"
  | "auth.failed"
  | "auth.impersonation_start"
  | "auth.impersonation_end";

export async function createAuditLog(params: {
  userId: string;
  action: AuditAction;
  resourceType?: EntityType;
  resourceId?: string;
  agencyId?: string | null;
  details?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
}): Promise<void> {
  try {
    await db.insert(auditLogs).values({
      userId: params.userId,
      action: params.action,
      entityType: params.resourceType,
      entityId: params.resourceId,
      agencyId: params.agencyId ?? null,
      metadata: params.details ?? null,
      ipAddress: params.ipAddress ?? null,
      userAgent: params.userAgent ?? null,
    });
  } catch {
    // Silent fail — audit log must never break the main action
  }
}

export async function getRequestMeta() {
  try {
    const h = await headers();
    const ip =
      h.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      h.get("x-real-ip") ??
      undefined;
    const userAgent = h.get("user-agent") ?? undefined;
    return { ipAddress: ip, userAgent };
  } catch {
    return { ipAddress: undefined, userAgent: undefined };
  }
}
