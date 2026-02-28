"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { messageTemplates } from "@/lib/db/schema";
import { eq, and, isNull } from "drizzle-orm";
import { createAuditLog } from "@/lib/audit-log";

type ActionResult<T = void> =
  | { success: true; data: T }
  | { success: false; error: string };

async function requireSuperAdmin() {
  const session = await auth();
  if (!session || session.user.role !== "SUPER_ADMIN") {
    throw new Error("Acesso negado");
  }
  return session.user;
}

// ---------------------------------------------------------------------------
// Platform templates (agency_id IS NULL)
// ---------------------------------------------------------------------------

export async function listPlatformTemplates(): Promise<
  ActionResult<typeof messageTemplates.$inferSelect[]>
> {
  try {
    await requireSuperAdmin();
    const rows = await db.query.messageTemplates.findMany({
      where: isNull(messageTemplates.agencyId),
      orderBy: (t, { asc }) => [asc(t.key)],
    });
    return { success: true, data: rows };
  } catch (err) {
    return { success: false, error: (err as Error).message };
  }
}

export async function upsertPlatformTemplate(params: {
  key: string;
  channel?: string;
  subject: string;
  body: string;
  isActive?: boolean;
}): Promise<ActionResult> {
  try {
    const user = await requireSuperAdmin();
    const channel = params.channel ?? "email";

    const existing = await db.query.messageTemplates.findFirst({
      where: and(
        eq(messageTemplates.key, params.key),
        eq(messageTemplates.channel, channel),
        isNull(messageTemplates.agencyId)
      ),
    });

    if (existing) {
      await db
        .update(messageTemplates)
        .set({
          subject: params.subject,
          body: params.body,
          isActive: params.isActive ?? existing.isActive,
          updatedAt: new Date(),
          updatedBy: user.id,
        })
        .where(eq(messageTemplates.id, existing.id));

      await createAuditLog({
        userId: user.id,
        action: "template_changed",
        details: {
          templateId: existing.id,
          key: params.key,
          channel,
          scope: "platform",
          before: { subject: existing.subject, body: existing.body, isActive: existing.isActive },
          after: { subject: params.subject, body: params.body, isActive: params.isActive ?? existing.isActive },
        },
      });
    } else {
      const [created] = await db
        .insert(messageTemplates)
        .values({
          scope: "platform",
          agencyId: null,
          key: params.key,
          channel,
          subject: params.subject,
          body: params.body,
          isActive: params.isActive ?? true,
          updatedBy: user.id,
        })
        .returning();

      await createAuditLog({
        userId: user.id,
        action: "template_changed",
        details: {
          templateId: created.id,
          key: params.key,
          channel,
          scope: "platform",
          before: null,
          after: { subject: params.subject, body: params.body, isActive: params.isActive ?? true },
        },
      });
    }

    return { success: true, data: undefined };
  } catch (err) {
    return { success: false, error: (err as Error).message };
  }
}

// ---------------------------------------------------------------------------
// Agency override templates
// ---------------------------------------------------------------------------

export async function listAgencyTemplateOverrides(agencyId: string): Promise<
  ActionResult<typeof messageTemplates.$inferSelect[]>
> {
  try {
    await requireSuperAdmin();
    const rows = await db.query.messageTemplates.findMany({
      where: eq(messageTemplates.agencyId, agencyId),
      orderBy: (t, { asc }) => [asc(t.key)],
    });
    return { success: true, data: rows };
  } catch (err) {
    return { success: false, error: (err as Error).message };
  }
}

export async function upsertAgencyTemplateOverride(params: {
  agencyId: string;
  key: string;
  channel?: string;
  subject: string;
  body: string;
  isActive?: boolean;
}): Promise<ActionResult> {
  try {
    const user = await requireSuperAdmin();
    const channel = params.channel ?? "email";

    const existing = await db.query.messageTemplates.findFirst({
      where: and(
        eq(messageTemplates.agencyId, params.agencyId),
        eq(messageTemplates.key, params.key),
        eq(messageTemplates.channel, channel)
      ),
    });

    if (existing) {
      await db
        .update(messageTemplates)
        .set({
          subject: params.subject,
          body: params.body,
          isActive: params.isActive ?? existing.isActive,
          updatedAt: new Date(),
          updatedBy: user.id,
        })
        .where(eq(messageTemplates.id, existing.id));

      await createAuditLog({
        userId: user.id,
        action: "template_changed",
        agencyId: params.agencyId,
        details: {
          templateId: existing.id,
          key: params.key,
          channel,
          scope: "agency",
          before: { subject: existing.subject, body: existing.body, isActive: existing.isActive },
          after: { subject: params.subject, body: params.body, isActive: params.isActive ?? existing.isActive },
        },
      });
    } else {
      const [created] = await db
        .insert(messageTemplates)
        .values({
          scope: "agency",
          agencyId: params.agencyId,
          key: params.key,
          channel,
          subject: params.subject,
          body: params.body,
          isActive: params.isActive ?? true,
          updatedBy: user.id,
        })
        .returning();

      await createAuditLog({
        userId: user.id,
        action: "template_changed",
        agencyId: params.agencyId,
        details: {
          templateId: created.id,
          key: params.key,
          channel,
          scope: "agency",
          before: null,
          after: { subject: params.subject, body: params.body, isActive: params.isActive ?? true },
        },
      });
    }

    return { success: true, data: undefined };
  } catch (err) {
    return { success: false, error: (err as Error).message };
  }
}

export async function clearAgencyTemplateOverride(params: {
  agencyId: string;
  key: string;
  channel?: string;
}): Promise<ActionResult> {
  try {
    const user = await requireSuperAdmin();
    const channel = params.channel ?? "email";

    const existing = await db.query.messageTemplates.findFirst({
      where: and(
        eq(messageTemplates.agencyId, params.agencyId),
        eq(messageTemplates.key, params.key),
        eq(messageTemplates.channel, channel)
      ),
    });

    if (!existing) {
      return { success: true, data: undefined };
    }

    await db
      .delete(messageTemplates)
      .where(eq(messageTemplates.id, existing.id));

    await createAuditLog({
      userId: user.id,
      action: "template_changed",
      agencyId: params.agencyId,
      details: {
        templateId: existing.id,
        key: params.key,
        channel,
        scope: "agency",
        before: { subject: existing.subject, body: existing.body, isActive: existing.isActive },
        after: null,
        cleared: true,
      },
    });

    return { success: true, data: undefined };
  } catch (err) {
    return { success: false, error: (err as Error).message };
  }
}
