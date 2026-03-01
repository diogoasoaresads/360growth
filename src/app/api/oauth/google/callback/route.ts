import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { integrations, integrationSecrets } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { encryptJson } from "@/lib/crypto/secrets";
import {
  exchangeGoogleAuthCode,
  verifyOAuthState,
} from "@/lib/integrations/providers/google-ads";
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

  // Verify HMAC-signed state
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

  // Session must match the user who initiated the flow
  const session = await auth();
  if (!session || session.user.id !== userId) {
    return redirectError(redirectBase, "session_mismatch");
  }

  if (ownerScope !== "agency") {
    return redirectError(redirectBase, "unsupported_scope");
  }

  // Exchange authorization code for tokens
  let tokens: Awaited<ReturnType<typeof exchangeGoogleAuthCode>>;
  try {
    tokens = await exchangeGoogleAuthCode(code);
  } catch {
    return redirectError(redirectBase, "token_exchange_failed");
  }

  const { access_token: _at, refresh_token, scope } = tokens;
  void _at; // access_token intentionally not stored

  // Find any existing integration + secret
  const [existing] = await db
    .select({ id: integrations.id, secretId: integrations.secretId })
    .from(integrations)
    .where(
      and(
        eq(integrations.agencyId, ownerId),
        eq(integrations.provider, "GOOGLE_ADS")
      )
    )
    .limit(1);

  let secretId: string;

  if (refresh_token) {
    const encrypted = encryptJson({
      refreshToken: refresh_token,
      obtainedAt: Date.now(),
      scopes: scope,
    });

    if (existing?.secretId) {
      await db
        .update(integrationSecrets)
        .set({
          encryptedPayload: encrypted,
          rotatedAt: new Date(),
          updatedAt: new Date(),
        })
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
  } else if (existing?.secretId) {
    // Google doesn't always re-issue refresh_token — keep existing
    secretId = existing.secretId;
  } else {
    // No token at all — user must re-consent
    return redirectError(redirectBase, "no_refresh_token");
  }

  // Upsert integration
  await db
    .insert(integrations)
    .values({
      agencyId: ownerId,
      provider: "GOOGLE_ADS",
      status: "connected",
      secretId,
      accountLabel: "Google Ads (conectado)",
      externalAccountId: null,
      scopes: scope ? scope.split(" ") : null,
      lastError: null,
    })
    .onConflictDoUpdate({
      target: [integrations.agencyId, integrations.provider],
      set: {
        status: "connected",
        secretId,
        accountLabel: "Google Ads (conectado)",
        externalAccountId: null,
        scopes: scope ? scope.split(" ") : null,
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
    details: { provider: "GOOGLE_ADS", ownerScope },
    ...meta,
  });

  const successUrl = new URL(redirectBase, APP_URL);
  successUrl.searchParams.set("connected", "google_ads");
  return NextResponse.redirect(successUrl);
}
