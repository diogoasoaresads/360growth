/**
 * src/lib/integrations/providers/ga4.ts
 *
 * Google Analytics 4 OAuth helpers + Analytics API client.
 * No "use server" — safe to import from server actions and API routes.
 *
 * Env:
 *   GOOGLE_OAUTH_CLIENT_ID
 *   GOOGLE_OAUTH_CLIENT_SECRET
 *   GA4_OAUTH_REDIRECT_URI
 *
 * Note: GA4 reuses the same Google OAuth client as Google Ads but uses a
 * separate redirect URI and scope. The developer token is NOT used here.
 *
 * SECURITY: never log refresh tokens or access tokens.
 */

export { signOAuthState, verifyOAuthState } from "./google-ads";

import { db } from "@/lib/db";
import { integrations, integrationSecrets } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { decryptJson } from "@/lib/crypto/secrets";
import { getGoogleAccessTokenFromRefreshToken } from "./google-ads";

const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GA4_ANALYTICS_ADMIN_BASE = "https://analyticsadmin.googleapis.com/v1beta";
const GA4_DATA_BASE = "https://analyticsdata.googleapis.com/v1beta";

const GA4_SCOPES = [
  "https://www.googleapis.com/auth/analytics.readonly",
  "https://www.googleapis.com/auth/userinfo.email",
].join(" ");

// ─── Authorization URL ────────────────────────────────────────────────────────

export function getGA4AuthorizationUrl(state: string): string {
  const clientId = process.env.GOOGLE_OAUTH_CLIENT_ID;
  const redirectUri = process.env.GA4_OAUTH_REDIRECT_URI;

  if (!clientId || !redirectUri) {
    throw new Error(
      "Configuração OAuth incompleta: verifique GOOGLE_OAUTH_CLIENT_ID e GA4_OAUTH_REDIRECT_URI."
    );
  }

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    access_type: "offline",
    prompt: "consent",
    scope: GA4_SCOPES,
    state,
  });

  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

// ─── Token exchange ───────────────────────────────────────────────────────────

interface TokenResponse {
  access_token: string;
  refresh_token?: string;
  expires_in?: number;
  scope?: string;
  token_type?: string;
  error?: string;
  error_description?: string;
}

export async function exchangeGA4AuthCode(code: string): Promise<{
  access_token: string;
  refresh_token?: string;
  expires_in?: number;
  scope?: string;
}> {
  const clientId = process.env.GOOGLE_OAUTH_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_OAUTH_CLIENT_SECRET;
  const redirectUri = process.env.GA4_OAUTH_REDIRECT_URI;

  if (!clientId || !clientSecret || !redirectUri) {
    throw new Error(
      "Configuração OAuth incompleta: verifique GOOGLE_OAUTH_CLIENT_ID, GOOGLE_OAUTH_CLIENT_SECRET e GA4_OAUTH_REDIRECT_URI."
    );
  }

  const body = new URLSearchParams({
    grant_type: "authorization_code",
    code,
    redirect_uri: redirectUri,
    client_id: clientId,
    client_secret: clientSecret,
  });

  const res = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });

  const data = (await res.json()) as TokenResponse;

  if (!res.ok || data.error) {
    const msg = data.error_description ?? data.error ?? `HTTP ${res.status}`;
    throw new Error(`Erro ao trocar código OAuth GA4: ${msg}`);
  }

  return {
    access_token: data.access_token,
    refresh_token: data.refresh_token,
    expires_in: data.expires_in,
    scope: data.scope,
  };
}

// ─── GA4 Properties ───────────────────────────────────────────────────────────

export interface GA4Property {
  name: string;        // e.g. "properties/123456"
  displayName: string;
  timeZone?: string;
  currencyCode?: string;
}

interface AccountSummariesResponse {
  accountSummaries?: Array<{
    account?: string;
    displayName?: string;
    propertySummaries?: Array<{
      property?: string;
      displayName?: string;
    }>;
  }>;
  error?: { message?: string; code?: number };
}

export async function ga4ListProperties(accessToken: string): Promise<GA4Property[]> {
  const res = await fetch(
    `${GA4_ANALYTICS_ADMIN_BASE}/accountSummaries`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
    }
  );

  if (res.status === 401) {
    throw new Error("Token GA4 inválido ou expirado. Reconecte o Google Analytics.");
  }

  const data = (await res.json()) as AccountSummariesResponse;

  if (!res.ok || data.error) {
    const msg = data.error?.message ?? `HTTP ${res.status}`;
    throw new Error(`Erro GA4 Admin API: ${msg}`);
  }

  const properties: GA4Property[] = [];
  for (const account of data.accountSummaries ?? []) {
    for (const prop of account.propertySummaries ?? []) {
      if (prop.property && prop.displayName) {
        properties.push({
          name: prop.property,
          displayName: prop.displayName,
        });
      }
    }
  }
  return properties;
}

// ─── GA4 Reports ──────────────────────────────────────────────────────────────

export interface GA4ReportRow {
  dimensionValues: string[];
  metricValues: string[];
}

interface RunReportResponse {
  rows?: Array<{
    dimensionValues?: Array<{ value?: string }>;
    metricValues?: Array<{ value?: string }>;
  }>;
  error?: { message?: string };
}

export async function ga4RunReport(
  propertyId: string,
  accessToken: string,
  opts: {
    dateRanges: Array<{ startDate: string; endDate: string }>;
    dimensions: string[];
    metrics: string[];
    limit?: number;
  }
): Promise<GA4ReportRow[]> {
  const body = {
    dateRanges: opts.dateRanges,
    dimensions: opts.dimensions.map((name) => ({ name })),
    metrics: opts.metrics.map((name) => ({ name })),
    limit: opts.limit ?? 100,
  };

  const res = await fetch(
    `${GA4_DATA_BASE}/properties/${propertyId}:runReport`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    }
  );

  if (res.status === 401) {
    throw new Error("Token GA4 inválido ou expirado. Reconecte o Google Analytics.");
  }

  const data = (await res.json()) as RunReportResponse;

  if (!res.ok || data.error) {
    const msg = data.error?.message ?? `HTTP ${res.status}`;
    throw new Error(`Erro GA4 Data API: ${msg}`);
  }

  return (data.rows ?? []).map((row) => ({
    dimensionValues: (row.dimensionValues ?? []).map((d) => d.value ?? ""),
    metricValues: (row.metricValues ?? []).map((m) => m.value ?? ""),
  }));
}

// ─── Access token helper ──────────────────────────────────────────────────────

/**
 * Reads the GA4 integration secret for the given agency,
 * decrypts the refresh token, and exchanges it for a fresh access token.
 * Returns null if the integration is not connected.
 */
export async function getGA4AccessToken(agencyId: string): Promise<string | null> {
  const [row] = await db
    .select({ secretId: integrations.secretId })
    .from(integrations)
    .where(
      and(
        eq(integrations.agencyId, agencyId),
        eq(integrations.provider, "GA4"),
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

  const payload = decryptJson<{ refreshToken: string }>(secret.encryptedPayload);
  if (!payload.refreshToken) return null;

  return getGoogleAccessTokenFromRefreshToken(payload.refreshToken);
}
