"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { auditLogs } from "@/lib/db/schema";
import { eq, desc, like, or } from "drizzle-orm";
import { sql } from "drizzle-orm";

export interface SystemHealthResult {
  database: {
    ok: boolean;
    latencyMs?: number;
    error?: string;
  };
  migration: {
    name?: string;
    appliedAt?: string;
  };
  resend: {
    configured: boolean;
    lastEmailAt?: string;
  };
  stripe: {
    configured: boolean;
    lastWebhookAt?: string;
  };
  errors: Array<{
    createdAt: string;
    action: string;
  }>;
}

export async function getSystemHealth(): Promise<SystemHealthResult> {
  const session = await auth();
  if (!session || session.user.role !== "SUPER_ADMIN") {
    throw new Error("Acesso negado");
  }

  const result: SystemHealthResult = {
    database: { ok: false },
    migration: {},
    resend: { configured: false },
    stripe: { configured: false },
    errors: [],
  };

  // -------------------------------------------------------------------------
  // 1) DATABASE CHECK
  // -------------------------------------------------------------------------
  try {
    const start = Date.now();
    await db.execute(sql`SELECT 1`);
    result.database = { ok: true, latencyMs: Date.now() - start };
  } catch (err) {
    result.database = {
      ok: false,
      error: err instanceof Error ? err.message.slice(0, 200) : "Erro desconhecido",
    };
  }

  // -------------------------------------------------------------------------
  // 2) LAST APPLIED MIGRATION
  // -------------------------------------------------------------------------
  try {
    const rows = await db.execute(
      sql`SELECT tag, created_at FROM __drizzle_migrations ORDER BY created_at DESC LIMIT 1`
    );
    const first = (rows as unknown as Array<Record<string, unknown>>)[0];
    if (first) {
      result.migration = {
        name: String(first.tag ?? ""),
        appliedAt: first.created_at
          ? new Date(String(first.created_at)).toISOString()
          : undefined,
      };
    }
  } catch {
    // Table may not exist — leave migration empty
  }

  // -------------------------------------------------------------------------
  // 3) RESEND
  // -------------------------------------------------------------------------
  result.resend.configured = !!process.env.RESEND_API_KEY;
  try {
    const lastEmail = await db.query.auditLogs.findFirst({
      where: eq(auditLogs.action, "email_sent"),
      orderBy: [desc(auditLogs.createdAt)],
    });
    if (lastEmail) {
      result.resend.lastEmailAt = lastEmail.createdAt.toISOString();
    }
  } catch {
    // Ignore
  }

  // -------------------------------------------------------------------------
  // 4) STRIPE
  // -------------------------------------------------------------------------
  result.stripe.configured = !!process.env.STRIPE_SECRET_KEY;
  try {
    const lastWebhook = await db.query.auditLogs.findFirst({
      where: like(auditLogs.action, "%stripe%"),
      orderBy: [desc(auditLogs.createdAt)],
    });
    if (lastWebhook) {
      result.stripe.lastWebhookAt = lastWebhook.createdAt.toISOString();
    }
  } catch {
    // Ignore
  }

  // -------------------------------------------------------------------------
  // 5) RECENT ERRORS
  // -------------------------------------------------------------------------
  try {
    const errorRows = await db.query.auditLogs.findMany({
      where: or(
        like(auditLogs.action, "%error%"),
        like(auditLogs.action, "%failed%"),
        eq(auditLogs.action, "auth.failed")
      ),
      orderBy: [desc(auditLogs.createdAt)],
      limit: 10,
    });
    result.errors = errorRows.map((r) => ({
      createdAt: r.createdAt.toISOString(),
      action: r.action,
    }));
  } catch {
    // Ignore
  }

  return result;
}
