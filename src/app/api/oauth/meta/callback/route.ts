import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { integrations, integrationSecrets } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { encryptJson } from "@/lib/crypto/secrets";
import {
  exchangeMetaAuthCode,
  exchangeForLongLivedToken,
  verifyOAuthState,
} from "@/lib/integrations/providers/meta-ads";
import { createAuditLog, getRequestMeta } from "@/lib/audit-log";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
const RETURN_PATH = "/agency/integrations";

function redirectError(returnTo: string, code: string): NextResponse {
  const url = new URL(returnTo, APP_URL);
  url.searchParams.set("oauth_error", code);
  return NextResponse.redirect(url);
}

export async function GET(req: NextRequest): Promise<NextResponse> {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");
  const stateParam = searchParams.get("state");
  const oauthError = searchParams.get("error");

  if (oauthError) {
    return redirectError(RETURN_PATH, oauthError === "access_denied" ? "access_denied" : "oauth_error");
  }

  if (!code || !stateParam) {
    return redirectError(RETURN_PATH, "missing_params");
  }

  const stateData = verifyOAuthState(stateParam);
  if (!stateData) {
    return redirectError(RETURN_PATH, "invalid_state");
  }

  const { ownerScope, ownerId, userId, returnTo } = stateData as {
    ownerScope: string;
    ownerId: string;
    userId: string;
    returnTo?: string;
  };
  const redirectBase = typeof returnTo === "string" ? returnTo : RETURN_PATH;

  const session = await auth();
  if (!session || session.user.id !== userId) {
    return redirectError(redirectBase, "session_mismatch");
  }

  if (ownerScope !== "agency") {
    return redirectError(redirectBase, "unsupported_scope");
  }

  // Exchange code for short-lived token
  let shortToken: string;
  try {
    const result = await exchangeMetaAuthCode(code);
    shortToken = result.access_token;
  } catch {
    return redirectError(redirectBase, "token_exchange_failed");
  }

  // Exchange for long-lived token (~60 days)
  let longToken: string;
  let expiresIn: number;
  try {
    const result = await exchangeForLongLivedToken(shortToken);
    longToken = result.access_token;
    expiresIn = result.expires_in;
  } catch {
    return redirectError(redirectBase, "token_exchange_failed");
  }

  const encrypted = encryptJson({
    longLivedToken: longToken,
    obtainedAt: Date.now(),
    expiresAt: Date.now() + expiresIn * 1000,
  });

  // Find existing integration
  const [existing] = await db
    .select({ id: integrations.id, secretId: integrations.secretId })
    .from(integrations)
    .where(
      and(
        eq(integrations.agencyId, ownerId),
        eq(integrations.provider, "META_ADS")
      )
    )
    .limit(1);

  let secretId: string;

  if (existing?.secretId) {
    await db
      .update(integrationSecrets)
      .set({ encryptedPayload: encrypted, rotatedAt: new Date(), updatedAt: new Date() })
      .where(eq(integrationSecrets.id, existing.secretId));
    secretId = existing.secretId;
  } else {
    const [newSecret] = await db
      .insert(integrationSecrets)
      .values({ encryptedPayload: encrypted, keyVersion: 1 })
      .returning({ id: integrationSecrets.id });
    if (!newSecret) return redirectError(redirectBase, "db_error");
    secretId = newSecret.id;
  }

  // Upsert integration
  await db
    .insert(integrations)
    .values({
      agencyId: ownerId,
      provider: "META_ADS",
      status: "connected",
      secretId,
      accountLabel: "Meta Ads (conectado)",
      externalAccountId: null,
      scopes: ["ads_read", "ads_management"],
      lastError: null,
    })
    .onConflictDoUpdate({
      target: [integrations.agencyId, integrations.provider],
      set: {
        status: "connected",
        secretId,
        accountLabel: "Meta Ads (conectado)",
        externalAccountId: null,
        scopes: ["ads_read", "ads_management"],
        lastError: null,
        updatedAt: new Date(),
      },
    });

  const meta = await getRequestMeta();
  await createAuditLog({
    userId: session.user.id,
    action: "integration_connected",
    agencyId: ownerId,
    resourceType: "INTEGRATION",
    details: { provider: "META_ADS", ownerScope },
    ...meta,
  });

  const successUrl = new URL(redirectBase, APP_URL);
  successUrl.searchParams.set("connected", "meta_ads");
  return NextResponse.redirect(successUrl);
}
