/**
 * src/lib/integrations/providers/google-ads.ts
 *
 * Google Ads OAuth helpers + API client.
 * No "use server" — safe to import from server actions, API routes and engine.
 *
 * Env:
 *   GOOGLE_OAUTH_CLIENT_ID
 *   GOOGLE_OAUTH_CLIENT_SECRET
 *   GOOGLE_OAUTH_REDIRECT_URI
 *   GOOGLE_OAUTH_SCOPES (optional — defaults to adwords + userinfo.email)
 *   GOOGLE_DEVELOPER_TOKEN (required for Google Ads API calls)
 *
 * SECURITY: never log refresh_token, access_token, client_secret or developer_token.
 */

import { createHmac, timingSafeEqual } from "crypto";

const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GOOGLE_ADS_BASE = "https://googleads.googleapis.com/v17";

// ─── OAuth state helpers ──────────────────────────────────────────────────────

export function signOAuthState(data: Record<string, unknown>): string {
  const secret = process.env.NEXTAUTH_SECRET ?? "";
  const payload = JSON.stringify({ ...data, ts: Date.now() });
  const sig = createHmac("sha256", secret).update(payload).digest("base64url");
  return Buffer.from(JSON.stringify({ payload, sig })).toString("base64url");
}

export function verifyOAuthState(
  state: string
): Record<string, unknown> | null {
  try {
    const decoded = JSON.parse(
      Buffer.from(state, "base64url").toString("utf8")
    ) as { payload: string; sig: string };

    const secret = process.env.NEXTAUTH_SECRET ?? "";
    const expected = createHmac("sha256", secret)
      .update(decoded.payload)
      .digest("base64url");

    const a = Buffer.from(expected, "utf8");
    const b = Buffer.from(decoded.sig, "utf8");
    if (a.length !== b.length || !timingSafeEqual(a, b)) return null;

    const data = JSON.parse(decoded.payload) as Record<string, unknown>;
    // 10 min window
    if (typeof data.ts === "number" && Date.now() - data.ts > 10 * 60 * 1000) {
      return null;
    }
    return data;
  } catch {
    return null;
  }
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

export async function exchangeGoogleAuthCode(code: string): Promise<{
  access_token: string;
  refresh_token?: string;
  expires_in?: number;
  scope?: string;
}> {
  const clientId = process.env.GOOGLE_OAUTH_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_OAUTH_CLIENT_SECRET;
  const redirectUri = process.env.GOOGLE_OAUTH_REDIRECT_URI;

  if (!clientId || !clientSecret || !redirectUri) {
    throw new Error(
      "Configuração OAuth incompleta: verifique GOOGLE_OAUTH_CLIENT_ID, GOOGLE_OAUTH_CLIENT_SECRET e GOOGLE_OAUTH_REDIRECT_URI."
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
    throw new Error(`Erro ao trocar código OAuth: ${msg}`);
  }

  return {
    access_token: data.access_token,
    refresh_token: data.refresh_token,
    expires_in: data.expires_in,
    scope: data.scope,
  };
}

export async function getGoogleAccessTokenFromRefreshToken(
  refreshToken: string
): Promise<string> {
  const clientId = process.env.GOOGLE_OAUTH_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_OAUTH_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error(
      "GOOGLE_OAUTH_CLIENT_ID e GOOGLE_OAUTH_CLIENT_SECRET são obrigatórios."
    );
  }

  const body = new URLSearchParams({
    grant_type: "refresh_token",
    refresh_token: refreshToken,
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
    if (
      data.error === "invalid_grant" ||
      (typeof msg === "string" && msg.includes("invalid_grant"))
    ) {
      throw new Error(
        "Token revogado ou expirado. Remova o acesso do app no Google e conecte novamente."
      );
    }
    throw new Error(`Erro ao obter access token: ${msg}`);
  }

  if (!data.access_token) {
    throw new Error("Access token não retornado pelo Google.");
  }
  return data.access_token;
}

// ─── Developer token guard ────────────────────────────────────────────────────

function getDeveloperToken(): string {
  const dt = process.env.GOOGLE_DEVELOPER_TOKEN;
  if (!dt) {
    throw new Error(
      "GOOGLE_DEVELOPER_TOKEN não configurado. Necessário para chamadas à Google Ads API."
    );
  }
  return dt;
}

function gadsHeaders(accessToken: string): Record<string, string> {
  return {
    Authorization: `Bearer ${accessToken}`,
    "developer-token": getDeveloperToken(),
    "Content-Type": "application/json",
  };
}

// ─── Google Ads API ───────────────────────────────────────────────────────────

export interface GoogleAdsCustomer {
  customerId: string;
  label: string;
}

export async function googleAdsListAccessibleCustomers(params: {
  accessToken: string;
}): Promise<GoogleAdsCustomer[]> {
  const res = await fetch(
    `${GOOGLE_ADS_BASE}/customers:listAccessibleCustomers`,
    {
      method: "GET",
      headers: gadsHeaders(params.accessToken),
    }
  );

  if (res.status === 401) {
    throw new Error("Access token inválido ou expirado. Reconecte o Google Ads.");
  }

  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as {
      error?: { message?: string };
    };
    throw new Error(
      body?.error?.message ?? `Erro Google Ads: HTTP ${res.status}`
    );
  }

  const data = (await res.json()) as { resourceNames?: string[] };
  return (data.resourceNames ?? []).map((rn) => {
    const customerId = rn.replace("customers/", "");
    return { customerId, label: `Google Ads ${customerId}` };
  });
}

export interface GoogleAdsCustomerInfo {
  name?: string;
  currencyCode?: string;
  timeZone?: string;
  isManager?: boolean;
}

export async function googleAdsGetCustomerInfo(
  customerId: string,
  opts: { accessToken: string }
): Promise<GoogleAdsCustomerInfo> {
  try {
    const res = await fetch(
      `${GOOGLE_ADS_BASE}/customers/${customerId}/googleAds:search`,
      {
        method: "POST",
        headers: gadsHeaders(opts.accessToken),
        body: JSON.stringify({
          query:
            "SELECT customer.id, customer.descriptive_name, customer.currency_code, customer.time_zone, customer.manager FROM customer LIMIT 1",
        }),
      }
    );

    if (!res.ok) return {};

    const data = (await res.json()) as {
      results?: Array<{
        customer?: {
          descriptiveName?: string;
          currencyCode?: string;
          timeZone?: string;
          manager?: boolean;
        };
      }>;
    };
    const row = data.results?.[0]?.customer;
    return {
      name: row?.descriptiveName,
      currencyCode: row?.currencyCode,
      timeZone: row?.timeZone,
      isManager: row?.manager,
    };
  } catch {
    return {};
  }
}

export interface GoogleAdsCampaign {
  campaignId: string;
  name: string;
  status?: string;
  channelType?: string;
}

export async function googleAdsListCampaigns(
  customerId: string,
  opts: { accessToken: string }
): Promise<GoogleAdsCampaign[]> {
  try {
    const res = await fetch(
      `${GOOGLE_ADS_BASE}/customers/${customerId}/googleAds:search`,
      {
        method: "POST",
        headers: gadsHeaders(opts.accessToken),
        body: JSON.stringify({
          query:
            "SELECT campaign.id, campaign.name, campaign.status, campaign.advertising_channel_type FROM campaign LIMIT 50",
        }),
      }
    );

    if (!res.ok) return [];

    const data = (await res.json()) as {
      results?: Array<{
        campaign?: {
          id?: string;
          name?: string;
          status?: string;
          advertisingChannelType?: string;
        };
      }>;
    };

    return (data.results ?? []).flatMap((r) => {
      const c = r.campaign;
      if (!c?.id) return [];
      return [
        {
          campaignId: String(c.id),
          name: c.name ?? `Campaign ${c.id}`,
          status: c.status,
          channelType: c.advertisingChannelType,
        },
      ];
    });
  } catch {
    return [];
  }
}
