/**
 * src/lib/integrations/providers/meta-ads.ts
 *
 * Meta Ads OAuth helpers + Graph API client.
 * No "use server" — safe to import from server actions and API routes.
 *
 * Env:
 *   META_APP_ID
 *   META_APP_SECRET
 *   META_OAUTH_REDIRECT_URI
 *
 * SECURITY: never log access tokens or app secrets.
 */

export { signOAuthState, verifyOAuthState } from "./google-ads";

const META_GRAPH_BASE = "https://graph.facebook.com/v19.0";

// ─── Authorization URL ────────────────────────────────────────────────────────

export function getMetaAuthorizationUrl(state: string): string {
  const appId = process.env.META_APP_ID;
  const redirectUri = process.env.META_OAUTH_REDIRECT_URI;

  if (!appId || !redirectUri) {
    throw new Error(
      "Configuração OAuth incompleta: verifique META_APP_ID e META_OAUTH_REDIRECT_URI."
    );
  }

  const params = new URLSearchParams({
    client_id: appId,
    redirect_uri: redirectUri,
    scope: "ads_read,ads_management",
    state,
    response_type: "code",
  });

  return `https://www.facebook.com/dialog/oauth?${params.toString()}`;
}

// ─── Token exchange ───────────────────────────────────────────────────────────

interface MetaTokenResponse {
  access_token?: string;
  token_type?: string;
  expires_in?: number;
  error?: { message?: string; type?: string; code?: number };
}

export async function exchangeMetaAuthCode(code: string): Promise<{
  access_token: string;
  token_type?: string;
}> {
  const appId = process.env.META_APP_ID;
  const appSecret = process.env.META_APP_SECRET;
  const redirectUri = process.env.META_OAUTH_REDIRECT_URI;

  if (!appId || !appSecret || !redirectUri) {
    throw new Error(
      "Configuração OAuth incompleta: verifique META_APP_ID, META_APP_SECRET e META_OAUTH_REDIRECT_URI."
    );
  }

  const params = new URLSearchParams({
    client_id: appId,
    client_secret: appSecret,
    redirect_uri: redirectUri,
    code,
  });

  const res = await fetch(`${META_GRAPH_BASE}/oauth/access_token?${params.toString()}`, {
    method: "GET",
  });

  const data = (await res.json()) as MetaTokenResponse;

  if (!res.ok || data.error || !data.access_token) {
    const msg = data.error?.message ?? `HTTP ${res.status}`;
    throw new Error(`Erro ao trocar código OAuth Meta: ${msg}`);
  }

  return { access_token: data.access_token, token_type: data.token_type };
}

export async function exchangeForLongLivedToken(shortLivedToken: string): Promise<{
  access_token: string;
  token_type?: string;
  expires_in: number;
}> {
  const appId = process.env.META_APP_ID;
  const appSecret = process.env.META_APP_SECRET;

  if (!appId || !appSecret) {
    throw new Error("META_APP_ID e META_APP_SECRET são obrigatórios.");
  }

  const params = new URLSearchParams({
    grant_type: "fb_exchange_token",
    client_id: appId,
    client_secret: appSecret,
    fb_exchange_token: shortLivedToken,
  });

  const res = await fetch(`${META_GRAPH_BASE}/oauth/access_token?${params.toString()}`, {
    method: "GET",
  });

  const data = (await res.json()) as MetaTokenResponse;

  if (!res.ok || data.error || !data.access_token) {
    const msg = data.error?.message ?? `HTTP ${res.status}`;
    throw new Error(`Erro ao obter token de longa duração Meta: ${msg}`);
  }

  return {
    access_token: data.access_token,
    token_type: data.token_type,
    expires_in: data.expires_in ?? 5_184_000, // default 60 days
  };
}

// ─── Ad Accounts ─────────────────────────────────────────────────────────────

export interface MetaAdAccount {
  id: string;
  name: string;
  currency: string;
  timezoneId?: string;
}

interface MetaAdAccountsResponse {
  data?: Array<{
    id?: string;
    name?: string;
    currency?: string;
    timezone_id?: string;
  }>;
  error?: { message?: string };
}

export async function metaListAdAccounts(accessToken: string): Promise<MetaAdAccount[]> {
  const params = new URLSearchParams({
    fields: "id,name,currency,timezone_id",
    access_token: accessToken,
  });

  const res = await fetch(`${META_GRAPH_BASE}/me/adaccounts?${params.toString()}`);

  if (res.status === 401) {
    throw new Error("Token Meta inválido ou expirado. Reconecte o Meta Ads.");
  }

  const data = (await res.json()) as MetaAdAccountsResponse;

  if (!res.ok || data.error) {
    const msg = data.error?.message ?? `HTTP ${res.status}`;
    throw new Error(`Erro Meta Graph API: ${msg}`);
  }

  return (data.data ?? []).flatMap((a) => {
    if (!a.id || !a.name) return [];
    return [
      {
        id: a.id,
        name: a.name,
        currency: a.currency ?? "BRL",
        timezoneId: a.timezone_id,
      },
    ];
  });
}

// ─── Campaigns ───────────────────────────────────────────────────────────────

export interface MetaCampaign {
  id: string;
  name: string;
  status: string;
  objective?: string;
}

interface MetaCampaignsResponse {
  data?: Array<{
    id?: string;
    name?: string;
    status?: string;
    objective?: string;
  }>;
  error?: { message?: string };
}

export async function metaListCampaigns(
  adAccountId: string,
  accessToken: string
): Promise<MetaCampaign[]> {
  const params = new URLSearchParams({
    fields: "id,name,status,objective",
    access_token: accessToken,
  });

  const res = await fetch(
    `${META_GRAPH_BASE}/${adAccountId}/campaigns?${params.toString()}`
  );

  if (res.status === 401) {
    throw new Error("Token Meta inválido ou expirado. Reconecte o Meta Ads.");
  }

  const data = (await res.json()) as MetaCampaignsResponse;

  if (!res.ok || data.error) {
    const msg = data.error?.message ?? `HTTP ${res.status}`;
    throw new Error(`Erro Meta Graph API: ${msg}`);
  }

  return (data.data ?? []).flatMap((c) => {
    if (!c.id || !c.name) return [];
    return [{ id: c.id, name: c.name, status: c.status ?? "UNKNOWN", objective: c.objective }];
  });
}
