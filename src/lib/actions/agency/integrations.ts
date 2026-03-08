"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { integrations, integrationSecrets } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { getActiveAgencyIdOrThrow } from "@/lib/active-context";
import { encryptJson, decryptJson } from "@/lib/crypto/secrets";
import { validateAsaasApiKey } from "@/lib/integrations/providers/asaas";
import { metaListAdAccounts } from "@/lib/integrations/providers/meta-ads";
import { ga4ListProperties, type GA4Property, getGA4AccessToken } from "@/lib/integrations/providers/ga4";
import { createAuditLog, getRequestMeta } from "@/lib/audit-log";
import { revalidatePath } from "next/cache";
import type { Integration, IntegrationProvider } from "@/lib/db/schema";
import type { ActionResult } from "@/lib/types";

async function requireAgencyAdmin() {
  const session = await auth();
  if (!session) throw new Error("Não autenticado");
  const { role } = session.user;
  if (role !== "AGENCY_ADMIN" && role !== "SUPER_ADMIN") {
    throw new Error("Apenas AGENCY_ADMIN pode gerenciar integrações.");
  }
  return session;
}

export async function listIntegrations(): Promise<Integration[]> {
  const session = await auth();
  if (!session) throw new Error("Não autenticado");
  const agencyId = await getActiveAgencyIdOrThrow();
  return db
    .select()
    .from(integrations)
    .where(eq(integrations.agencyId, agencyId));
}

export async function connectAsaas(params: {
  apiKey: string;
  label?: string;
}): Promise<void> {
  const session = await requireAgencyAdmin();
  const agencyId = await getActiveAgencyIdOrThrow();

  const validation = await validateAsaasApiKey(params.apiKey);
  if (!validation.ok) {
    throw new Error(validation.error ?? "API Key inválida.");
  }

  const accountLabel =
    params.label?.trim() || validation.accountLabel || "Conta Asaas";

  // Criptografa e salva o secret
  const encrypted = encryptJson({ apiKey: params.apiKey });

  // Upsert secret
  const [secret] = await db
    .insert(integrationSecrets)
    .values({
      encryptedPayload: encrypted,
      keyVersion: 1,
    })
    .returning({ id: integrationSecrets.id });

  if (!secret) throw new Error("Erro ao salvar credenciais.");

  // Upsert integration
  await db
    .insert(integrations)
    .values({
      agencyId,
      provider: "ASAAS",
      status: "connected",
      accountLabel,
      externalAccountId: validation.externalAccountId ?? null,
      secretId: secret.id,
      lastError: null,
      lastSyncedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: [integrations.agencyId, integrations.provider],
      set: {
        status: "connected",
        accountLabel,
        externalAccountId: validation.externalAccountId ?? null,
        secretId: secret.id,
        lastError: null,
        lastSyncedAt: new Date(),
        updatedAt: new Date(),
      },
    });

  const meta = await getRequestMeta();
  await createAuditLog({
    userId: session.user.id,
    action: "integration_connected",
    agencyId,
    resourceType: "INTEGRATION",
    details: { provider: "ASAAS", accountLabel, agencyId },
    ...meta,
  });

  revalidatePath("/agency/integrations");
}

export async function rotateAsaasKey(params: {
  apiKey: string;
}): Promise<void> {
  const session = await requireAgencyAdmin();
  const agencyId = await getActiveAgencyIdOrThrow();

  const validation = await validateAsaasApiKey(params.apiKey);
  if (!validation.ok) {
    throw new Error(validation.error ?? "API Key inválida.");
  }

  const [existing] = await db
    .select({ id: integrations.id, secretId: integrations.secretId })
    .from(integrations)
    .where(
      and(
        eq(integrations.agencyId, agencyId),
        eq(integrations.provider, "ASAAS")
      )
    )
    .limit(1);

  if (!existing) {
    throw new Error("Integração Asaas não encontrada. Conecte primeiro.");
  }

  const encrypted = encryptJson({ apiKey: params.apiKey });

  if (existing.secretId) {
    // Atualiza secret existente com rotatedAt
    await db
      .update(integrationSecrets)
      .set({
        encryptedPayload: encrypted,
        rotatedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(integrationSecrets.id, existing.secretId));
  } else {
    // Cria novo secret e vincula
    const [newSecret] = await db
      .insert(integrationSecrets)
      .values({ encryptedPayload: encrypted, keyVersion: 1 })
      .returning({ id: integrationSecrets.id });

    await db
      .update(integrations)
      .set({ secretId: newSecret!.id, updatedAt: new Date() })
      .where(eq(integrations.id, existing.id));
  }

  await db
    .update(integrations)
    .set({ status: "connected", lastError: null, updatedAt: new Date() })
    .where(eq(integrations.id, existing.id));

  const meta = await getRequestMeta();
  await createAuditLog({
    userId: session.user.id,
    action: "integration_rotated",
    agencyId,
    resourceType: "INTEGRATION",
    details: { provider: "ASAAS", agencyId },
    ...meta,
  });

  revalidatePath("/agency/integrations");
}

export async function disconnectProvider(params: {
  provider: IntegrationProvider;
}): Promise<void> {
  const session = await requireAgencyAdmin();
  const agencyId = await getActiveAgencyIdOrThrow();

  await db
    .update(integrations)
    .set({ status: "disconnected", updatedAt: new Date() })
    .where(
      and(
        eq(integrations.agencyId, agencyId),
        eq(integrations.provider, params.provider)
      )
    );

  const meta = await getRequestMeta();
  await createAuditLog({
    userId: session.user.id,
    action: "integration_disconnected",
    agencyId,
    resourceType: "INTEGRATION",
    details: { provider: params.provider, agencyId },
    ...meta,
  });

  revalidatePath("/agency/integrations");
}

/** Uso interno: marcar integração com erro */
export async function markIntegrationError(params: {
  agencyId: string;
  provider: IntegrationProvider;
  message: string;
}): Promise<void> {
  await db
    .update(integrations)
    .set({
      status: "error",
      lastError: params.message,
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(integrations.agencyId, params.agencyId),
        eq(integrations.provider, params.provider)
      )
    );
}

export async function syncMetaAdAccounts(): Promise<ActionResult<{ synced: number }>> {
  try {
    const session = await requireAgencyAdmin();
    const agencyId = await getActiveAgencyIdOrThrow();

    const [row] = await db
      .select({ secretId: integrations.secretId, status: integrations.status })
      .from(integrations)
      .where(
        and(
          eq(integrations.agencyId, agencyId),
          eq(integrations.provider, "META_ADS"),
          eq(integrations.status, "connected")
        )
      )
      .limit(1);

    if (!row?.secretId) {
      return { success: false, error: "Meta Ads não conectado." };
    }

    const [secret] = await db
      .select({ encryptedPayload: integrationSecrets.encryptedPayload })
      .from(integrationSecrets)
      .where(eq(integrationSecrets.id, row.secretId))
      .limit(1);

    if (!secret) return { success: false, error: "Credenciais não encontradas." };

    const payload = decryptJson<{ longLivedToken: string; expiresAt: number }>(
      secret.encryptedPayload
    );

    // Warn if token is within 7 days of expiry or already expired
    const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
    if (payload.expiresAt && payload.expiresAt - Date.now() < sevenDaysMs) {
      return { success: false, error: "Token Meta expirado ou próximo de expirar. Reconecte o Meta Ads." };
    }

    const accounts = await metaListAdAccounts(payload.longLivedToken);

    await db
      .update(integrations)
      .set({ lastSyncedAt: new Date(), updatedAt: new Date() })
      .where(
        and(
          eq(integrations.agencyId, agencyId),
          eq(integrations.provider, "META_ADS")
        )
      );

    const meta = await getRequestMeta();
    await createAuditLog({
      userId: session.user.id,
      action: "integration_job_finished",
      agencyId,
      resourceType: "INTEGRATION",
      details: { provider: "META_ADS", synced: accounts.length },
      ...meta,
    });

    revalidatePath("/agency/integrations");
    return { success: true, data: { synced: accounts.length } };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Erro ao sincronizar Meta Ads",
    };
  }
}

export async function syncGA4Properties(): Promise<ActionResult<{ properties: GA4Property[] }>> {
  try {
    const session = await requireAgencyAdmin();
    const agencyId = await getActiveAgencyIdOrThrow();

    const accessToken = await getGA4AccessToken(agencyId);
    if (!accessToken) {
      return { success: false, error: "GA4 não conectado ou token inválido." };
    }

    const properties = await ga4ListProperties(accessToken);

    await db
      .update(integrations)
      .set({ lastSyncedAt: new Date(), updatedAt: new Date() })
      .where(
        and(
          eq(integrations.agencyId, agencyId),
          eq(integrations.provider, "GA4")
        )
      );

    const meta = await getRequestMeta();
    await createAuditLog({
      userId: session.user.id,
      action: "integration_job_finished",
      agencyId,
      resourceType: "INTEGRATION",
      details: { provider: "GA4", propertyCount: properties.length },
      ...meta,
    });

    revalidatePath("/agency/integrations");
    return { success: true, data: { properties } };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Erro ao sincronizar GA4",
    };
  }
}

/** Apenas para uso interno — retorna apiKey descriptografada */
export async function getAsaasApiKey(agencyId: string): Promise<string | null> {
  const [row] = await db
    .select({ secretId: integrations.secretId, status: integrations.status })
    .from(integrations)
    .where(
      and(
        eq(integrations.agencyId, agencyId),
        eq(integrations.provider, "ASAAS"),
        eq(integrations.status, "connected")
      )
    )
    .limit(1);

  if (!row?.secretId) return null;

  const [secret] = await db
    .select({ encryptedPayload: integrationSecrets.encryptedPayload })
    .from(integrationSecrets)
    .where(eq(integrationSecrets.id, row.secretId))
    .limit(1);

  if (!secret) return null;

  const payload = decryptJson<{ apiKey: string }>(secret.encryptedPayload);
  return payload.apiKey ?? null;
}
