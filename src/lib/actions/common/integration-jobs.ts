"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  integrations,
  integrationSecrets,
  integrationJobs,
  adAccounts,
  adCampaigns,
} from "@/lib/db/schema";
import type { IntegrationJob, IntegrationProvider, JobStatus } from "@/lib/db/schema";
import type { Session } from "next-auth";
import {
  getGoogleAccessTokenFromRefreshToken,
  googleAdsListAccessibleCustomers,
  googleAdsGetCustomerInfo,
  googleAdsListCampaigns,
} from "@/lib/integrations/providers/google-ads";
import { eq, and, desc } from "drizzle-orm";
import type { SQL } from "drizzle-orm";
import { getActiveAgencyIdOrThrow } from "@/lib/active-context";
import { decryptJson } from "@/lib/crypto/secrets";
import { asaasPing } from "@/lib/integrations/providers/asaas";
import { createAuditLog, getRequestMeta } from "@/lib/audit-log";
import {
  normalizeJobError,
  computeDurationMs,
} from "@/lib/integrations/jobs/engine";
import { revalidatePath } from "next/cache";

// ─── Internal helpers ──────────────────────────────────────────────────────────

async function _resolveAgencyId(
  session: Session
): Promise<string | null> {
  if (session.user.role === "SUPER_ADMIN") return null; // no single agency
  if (
    session.user.role === "AGENCY_ADMIN" ||
    session.user.role === "AGENCY_MEMBER"
  ) {
    return getActiveAgencyIdOrThrow();
  }
  return null;
}

async function _ensureIntegrationOwnership(
  integrationId: string,
  agencyId: string | null
): Promise<typeof integrations.$inferSelect> {
  const conditions: SQL[] = [eq(integrations.id, integrationId)];
  if (agencyId) conditions.push(eq(integrations.agencyId, agencyId));

  const [row] = await db
    .select()
    .from(integrations)
    .where(conditions.length === 1 ? conditions[0]! : and(...(conditions as [SQL, ...SQL[]])))
    .limit(1);

  if (!row) throw new Error("Integração não encontrada.");
  return row;
}

async function _executeHandler(ctx: {
  integrationId: string;
  provider: string;
  type: string;
}): Promise<{ ok: boolean; message: string }> {
  const { provider, type, integrationId } = ctx;

  if (provider === "ASAAS" && (type === "test" || type === "sync")) {
    const [row] = await db
      .select({ secretId: integrations.secretId })
      .from(integrations)
      .where(eq(integrations.id, integrationId))
      .limit(1);

    if (!row?.secretId) {
      return {
        ok: false,
        message: "Integração sem credenciais. Conecte o Asaas primeiro.",
      };
    }

    const [secret] = await db
      .select({ encryptedPayload: integrationSecrets.encryptedPayload })
      .from(integrationSecrets)
      .where(eq(integrationSecrets.id, row.secretId))
      .limit(1);

    if (!secret) {
      return { ok: false, message: "Credenciais não encontradas no banco." };
    }

    const payload = decryptJson<{ apiKey: string }>(secret.encryptedPayload);
    return asaasPing(payload.apiKey);
  }

  if (provider === "GOOGLE_ADS" && (type === "test" || type === "sync")) {
    const [integration] = await db
      .select({
        secretId: integrations.secretId,
        externalAccountId: integrations.externalAccountId,
        agencyId: integrations.agencyId,
      })
      .from(integrations)
      .where(eq(integrations.id, integrationId))
      .limit(1);

    if (!integration?.secretId) {
      return {
        ok: false,
        message: "Google Ads sem credenciais. Conecte via OAuth primeiro.",
      };
    }

    const [secret] = await db
      .select({ encryptedPayload: integrationSecrets.encryptedPayload })
      .from(integrationSecrets)
      .where(eq(integrationSecrets.id, integration.secretId))
      .limit(1);

    if (!secret) {
      return { ok: false, message: "Credenciais não encontradas no banco." };
    }

    const payload = decryptJson<{ refreshToken: string }>(
      secret.encryptedPayload
    );
    if (!payload.refreshToken) {
      return {
        ok: false,
        message:
          "Refresh token inválido. Remova o acesso do app no Google e reconecte.",
      };
    }

    let accessToken: string;
    try {
      accessToken = await getGoogleAccessTokenFromRefreshToken(
        payload.refreshToken
      );
    } catch (e) {
      return { ok: false, message: normalizeJobError(e) };
    }

    if (type === "test") {
      try {
        const customers = await googleAdsListAccessibleCustomers({ accessToken });
        return {
          ok: true,
          message: `Google Ads conectado. ${customers.length} conta(s) acessível(is).`,
        };
      } catch (e) {
        return { ok: false, message: normalizeJobError(e) };
      }
    }

    // type === "sync"
    if (!integration.externalAccountId) {
      return {
        ok: false,
        message:
          "Nenhuma conta Google Ads selecionada. Clique em 'Selecionar conta' primeiro.",
      };
    }

    const customerId = integration.externalAccountId;
    const ownerScope = "agency";
    const ownerId = integration.agencyId;

    try {
      const customerInfo = await googleAdsGetCustomerInfo(customerId, {
        accessToken,
      });

      await db
        .insert(adAccounts)
        .values({
          ownerScope,
          ownerId,
          provider: "GOOGLE_ADS",
          externalAccountId: customerId,
          name: customerInfo.name ?? null,
          currencyCode: customerInfo.currencyCode ?? null,
          timeZone: customerInfo.timeZone ?? null,
          isManager: customerInfo.isManager ?? null,
        })
        .onConflictDoUpdate({
          target: [
            adAccounts.ownerScope,
            adAccounts.ownerId,
            adAccounts.provider,
            adAccounts.externalAccountId,
          ],
          set: {
            name: customerInfo.name ?? null,
            currencyCode: customerInfo.currencyCode ?? null,
            timeZone: customerInfo.timeZone ?? null,
            isManager: customerInfo.isManager ?? null,
            updatedAt: new Date(),
          },
        });

      const campaigns = await googleAdsListCampaigns(customerId, {
        accessToken,
      });

      for (const c of campaigns) {
        await db
          .insert(adCampaigns)
          .values({
            ownerScope,
            ownerId,
            provider: "GOOGLE_ADS",
            externalAccountId: customerId,
            campaignId: c.campaignId,
            name: c.name,
            status: c.status ?? null,
            channelType: c.channelType ?? null,
          })
          .onConflictDoUpdate({
            target: [
              adCampaigns.ownerScope,
              adCampaigns.ownerId,
              adCampaigns.provider,
              adCampaigns.externalAccountId,
              adCampaigns.campaignId,
            ],
            set: {
              name: c.name,
              status: c.status ?? null,
              channelType: c.channelType ?? null,
              updatedAt: new Date(),
            },
          });
      }

      return {
        ok: true,
        message: `Sync concluído: 1 conta, ${campaigns.length} campanha(s).`,
      };
    } catch (e) {
      return { ok: false, message: normalizeJobError(e) };
    }
  }

  const labels: Record<string, string> = {
    META_ADS: "Meta Ads",
    GA4: "Google Analytics 4",
    OTHER: "Integração",
  };
  const label = labels[provider] ?? provider;
  return {
    ok: false,
    message: `${label}: integração ainda não disponível (Em breve).`,
  };
}

async function _finalizeJob(params: {
  jobId: string;
  integrationId: string;
  type: string;
  result: { ok: boolean; message: string };
  startedAt: Date;
}): Promise<number> {
  const { jobId, integrationId, type, result, startedAt } = params;
  const finishedAt = new Date();
  const durationMs = computeDurationMs(startedAt, finishedAt);

  await db
    .update(integrationJobs)
    .set({
      status: result.ok ? "success" : "failed",
      finishedAt,
      lastError: result.ok ? null : result.message,
      updatedAt: finishedAt,
    })
    .where(eq(integrationJobs.id, jobId));

  if (type === "test") {
    await db
      .update(integrations)
      .set({
        status: result.ok ? "connected" : "error",
        lastError: result.ok ? null : result.message,
        lastTestedAt: finishedAt,
        updatedAt: finishedAt,
      })
      .where(eq(integrations.id, integrationId));
  } else if (type === "sync" && result.ok) {
    await db
      .update(integrations)
      .set({ lastSyncedAt: finishedAt, updatedAt: finishedAt })
      .where(eq(integrations.id, integrationId));
  }

  return durationMs;
}

// ─── Exported actions ──────────────────────────────────────────────────────────

export async function listJobs(params?: {
  provider?: string;
  status?: string;
  integrationId?: string;
  limit?: number;
}): Promise<IntegrationJob[]> {
  const session = await auth();
  if (!session) throw new Error("Não autenticado");

  const limit = Math.min(params?.limit ?? 50, 200);
  const conditions: SQL[] = [];

  if (session.user.role === "SUPER_ADMIN") {
    // no tenant restriction
  } else if (
    session.user.role === "AGENCY_ADMIN" ||
    session.user.role === "AGENCY_MEMBER"
  ) {
    const agencyId = await getActiveAgencyIdOrThrow();
    conditions.push(eq(integrationJobs.ownerScope, "agency"));
    conditions.push(eq(integrationJobs.ownerId, agencyId));
  } else {
    throw new Error("Acesso negado");
  }

  if (params?.provider)
    conditions.push(
      eq(integrationJobs.provider, params.provider as IntegrationProvider)
    );
  if (params?.status)
    conditions.push(eq(integrationJobs.status, params.status as JobStatus));
  if (params?.integrationId)
    conditions.push(eq(integrationJobs.integrationId, params.integrationId));

  const where =
    conditions.length === 0
      ? undefined
      : conditions.length === 1
        ? conditions[0]!
        : and(...(conditions as [SQL, ...SQL[]]));

  return db
    .select()
    .from(integrationJobs)
    .where(where)
    .orderBy(desc(integrationJobs.createdAt))
    .limit(limit);
}

export async function createJob(params: {
  integrationId: string;
  type: "sync" | "test" | "health_check";
  meta?: Record<string, unknown>;
}): Promise<string> {
  const session = await auth();
  if (!session) throw new Error("Não autenticado");

  const agencyId = await _resolveAgencyId(session);
  const integration = await _ensureIntegrationOwnership(
    params.integrationId,
    agencyId
  );

  const [job] = await db
    .insert(integrationJobs)
    .values({
      integrationId: params.integrationId,
      ownerScope: "agency",
      ownerId: integration.agencyId,
      provider: integration.provider,
      type: params.type,
      status: "pending",
      meta: params.meta ?? null,
    })
    .returning({ id: integrationJobs.id });

  if (!job) throw new Error("Erro ao criar job.");

  const meta = await getRequestMeta();
  await createAuditLog({
    userId: session.user.id,
    action: "integration_job_created",
    agencyId: integration.agencyId,
    resourceType: "INTEGRATION",
    resourceId: params.integrationId,
    details: { jobId: job.id, type: params.type, provider: integration.provider },
    ...meta,
  });

  return job.id;
}

export async function runJobNow(params: {
  jobId: string;
}): Promise<{ ok: boolean; message: string }> {
  const session = await auth();
  if (!session) throw new Error("Não autenticado");

  const [job] = await db
    .select()
    .from(integrationJobs)
    .where(eq(integrationJobs.id, params.jobId))
    .limit(1);

  if (!job) throw new Error("Job não encontrado.");

  // RBAC
  if (session.user.role !== "SUPER_ADMIN") {
    const agencyId = await getActiveAgencyIdOrThrow();
    if (job.ownerScope !== "agency" || job.ownerId !== agencyId) {
      throw new Error("Acesso negado a este job.");
    }
  }

  // Concurrency guard
  const running = await db
    .select({ id: integrationJobs.id })
    .from(integrationJobs)
    .where(
      and(
        eq(integrationJobs.integrationId, job.integrationId),
        eq(integrationJobs.status, "running")
      )
    )
    .limit(1);

  if (running.length > 0 && running[0]!.id !== params.jobId) {
    throw new Error(
      "Já existe um job em execução para esta integração. Aguarde a conclusão."
    );
  }

  const now = new Date();
  await db
    .update(integrationJobs)
    .set({
      status: "running",
      startedAt: now,
      attempts: (job.attempts ?? 0) + 1,
      updatedAt: now,
    })
    .where(eq(integrationJobs.id, params.jobId));

  const requestMeta = await getRequestMeta();
  await createAuditLog({
    userId: session.user.id,
    action: "integration_job_started",
    agencyId: job.ownerScope === "agency" ? job.ownerId : null,
    resourceType: "INTEGRATION",
    resourceId: job.integrationId,
    details: { jobId: params.jobId, type: job.type, provider: job.provider },
    ...requestMeta,
  });

  let result: { ok: boolean; message: string };
  try {
    result = await _executeHandler({
      integrationId: job.integrationId,
      provider: job.provider,
      type: job.type,
    });
  } catch (e) {
    result = { ok: false, message: normalizeJobError(e) };
  }

  const durationMs = await _finalizeJob({
    jobId: params.jobId,
    integrationId: job.integrationId,
    type: job.type,
    result,
    startedAt: now,
  });

  await createAuditLog({
    userId: session.user.id,
    action: "integration_job_finished",
    agencyId: job.ownerScope === "agency" ? job.ownerId : null,
    resourceType: "INTEGRATION",
    resourceId: job.integrationId,
    details: {
      jobId: params.jobId,
      ok: result.ok,
      durationMs,
      provider: job.provider,
      type: job.type,
    },
    ...requestMeta,
  });

  revalidatePath("/agency/integrations");
  return result;
}

export async function runIntegrationAction(params: {
  integrationId: string;
  action: "test" | "sync";
}): Promise<{ ok: boolean; message: string; jobId: string }> {
  const session = await auth();
  if (!session) throw new Error("Não autenticado");

  const agencyId = await _resolveAgencyId(session);
  const integration = await _ensureIntegrationOwnership(
    params.integrationId,
    agencyId
  );

  const now = new Date();
  const [job] = await db
    .insert(integrationJobs)
    .values({
      integrationId: params.integrationId,
      ownerScope: "agency",
      ownerId: integration.agencyId,
      provider: integration.provider,
      type: params.action,
      status: "running",
      attempts: 1,
      startedAt: now,
      meta: { trigger: "manual_ui" },
    })
    .returning({ id: integrationJobs.id });

  if (!job) throw new Error("Erro ao criar job.");

  const requestMeta = await getRequestMeta();
  await createAuditLog({
    userId: session.user.id,
    action: "integration_job_created",
    agencyId: integration.agencyId,
    resourceType: "INTEGRATION",
    resourceId: params.integrationId,
    details: {
      jobId: job.id,
      type: params.action,
      provider: integration.provider,
    },
    ...requestMeta,
  });

  await createAuditLog({
    userId: session.user.id,
    action: "integration_job_started",
    agencyId: integration.agencyId,
    resourceType: "INTEGRATION",
    resourceId: params.integrationId,
    details: { jobId: job.id, type: params.action, provider: integration.provider },
    ...requestMeta,
  });

  let result: { ok: boolean; message: string };
  try {
    result = await _executeHandler({
      integrationId: params.integrationId,
      provider: integration.provider,
      type: params.action,
    });
  } catch (e) {
    result = { ok: false, message: normalizeJobError(e) };
  }

  const durationMs = await _finalizeJob({
    jobId: job.id,
    integrationId: params.integrationId,
    type: params.action,
    result,
    startedAt: now,
  });

  await createAuditLog({
    userId: session.user.id,
    action: "integration_job_finished",
    agencyId: integration.agencyId,
    resourceType: "INTEGRATION",
    resourceId: params.integrationId,
    details: {
      jobId: job.id,
      ok: result.ok,
      durationMs,
      provider: integration.provider,
      type: params.action,
    },
    ...requestMeta,
  });

  revalidatePath("/agency/integrations");
  return { ...result, jobId: job.id };
}
