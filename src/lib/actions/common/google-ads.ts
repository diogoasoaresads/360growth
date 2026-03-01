"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { integrations, integrationSecrets } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import type { Session } from "next-auth";
import { getActiveAgencyIdOrThrow } from "@/lib/active-context";
import { decryptJson } from "@/lib/crypto/secrets";
import {
  getGoogleAccessTokenFromRefreshToken,
  googleAdsListAccessibleCustomers,
  type GoogleAdsCustomer,
} from "@/lib/integrations/providers/google-ads";
import { createAuditLog, getRequestMeta } from "@/lib/audit-log";
import { revalidatePath } from "next/cache";

// ─── Internal helpers ──────────────────────────────────────────────────────────

async function _requireAgencyAccess(): Promise<{
  session: Session;
  agencyId: string;
}> {
  const session = await auth();
  if (!session) throw new Error("Não autenticado");
  const { role } = session.user;
  if (role !== "AGENCY_ADMIN" && role !== "SUPER_ADMIN") {
    throw new Error("Acesso negado: apenas AGENCY_ADMIN pode gerenciar integrações.");
  }
  const agencyId = await getActiveAgencyIdOrThrow();
  return { session, agencyId };
}

async function _getRefreshToken(agencyId: string): Promise<string> {
  const [row] = await db
    .select({ secretId: integrations.secretId })
    .from(integrations)
    .where(
      and(
        eq(integrations.agencyId, agencyId),
        eq(integrations.provider, "GOOGLE_ADS")
      )
    )
    .limit(1);

  if (!row?.secretId) {
    throw new Error(
      "Google Ads não conectado ou sem credenciais. Conecte primeiro via OAuth."
    );
  }

  const [secret] = await db
    .select({ encryptedPayload: integrationSecrets.encryptedPayload })
    .from(integrationSecrets)
    .where(eq(integrationSecrets.id, row.secretId))
    .limit(1);

  if (!secret) throw new Error("Credenciais não encontradas no banco.");

  const payload = decryptJson<{ refreshToken: string }>(
    secret.encryptedPayload
  );
  if (!payload.refreshToken) {
    throw new Error(
      "Refresh token inválido. Remova o acesso do app no Google e reconecte."
    );
  }
  return payload.refreshToken;
}

// ─── Exported actions ──────────────────────────────────────────────────────────

export async function googleAdsListAccounts(): Promise<GoogleAdsCustomer[]> {
  const { agencyId } = await _requireAgencyAccess();
  const refreshToken = await _getRefreshToken(agencyId);
  const accessToken = await getGoogleAccessTokenFromRefreshToken(refreshToken);
  return googleAdsListAccessibleCustomers({ accessToken });
}

export async function googleAdsSelectAccount(params: {
  customerId: string;
}): Promise<void> {
  const { session, agencyId } = await _requireAgencyAccess();

  // Sanitize: only allow digits and dashes
  const customerId = params.customerId.trim().replace(/[^0-9-]/g, "");
  if (!customerId) throw new Error("customerId inválido.");

  await db
    .update(integrations)
    .set({
      externalAccountId: customerId,
      accountLabel: `Google Ads ${customerId}`,
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(integrations.agencyId, agencyId),
        eq(integrations.provider, "GOOGLE_ADS")
      )
    );

  const meta = await getRequestMeta();
  await createAuditLog({
    userId: session.user.id,
    action: "integration_account_selected",
    agencyId,
    resourceType: "INTEGRATION",
    details: { provider: "GOOGLE_ADS", customerId },
    ...meta,
  });

  revalidatePath("/agency/integrations");
}

export async function googleAdsDisconnect(): Promise<void> {
  const { session, agencyId } = await _requireAgencyAccess();

  await db
    .update(integrations)
    .set({
      status: "disconnected",
      externalAccountId: null,
      lastError: null,
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(integrations.agencyId, agencyId),
        eq(integrations.provider, "GOOGLE_ADS")
      )
    );

  const meta = await getRequestMeta();
  await createAuditLog({
    userId: session.user.id,
    action: "integration_disconnected",
    agencyId,
    resourceType: "INTEGRATION",
    details: { provider: "GOOGLE_ADS" },
    ...meta,
  });

  revalidatePath("/agency/integrations");
}
