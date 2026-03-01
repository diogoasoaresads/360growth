/**
 * src/lib/integrations/providers/asaas.ts
 *
 * Adapter Asaas — validação de API Key e metadados de conta.
 * Não contém "use server" — pode ser importado de actions, routes e auth.
 *
 * Env:
 *   ASAAS_BASE_URL  (padrão: https://api.asaas.com/v3)
 *   Para sandbox:    https://sandbox.asaas.com/api/v3
 */

const BASE_URL =
  process.env.ASAAS_BASE_URL?.replace(/\/$/, "") ??
  "https://api.asaas.com/v3";

interface AsaasAccountResponse {
  id?: string | number;
  name?: string;
  companyName?: string;
  email?: string;
  cpfCnpj?: string;
  [key: string]: unknown;
}

/**
 * Valida uma API Key do Asaas fazendo uma chamada autenticada.
 * Nunca loga a apiKey.
 */
export async function validateAsaasApiKey(apiKey: string): Promise<{
  ok: boolean;
  accountLabel?: string;
  externalAccountId?: string;
  error?: string;
}> {
  try {
    const res = await fetch(`${BASE_URL}/myaccount`, {
      method: "GET",
      headers: {
        access_token: apiKey,
        "Content-Type": "application/json",
      },
      // Timeout implícito via AbortSignal em ambientes modernos
    });

    if (res.status === 401 || res.status === 403) {
      return { ok: false, error: "API Key inválida ou sem permissão." };
    }
    if (!res.ok) {
      // Fallback: tentar endpoint de customers (sandbox pode divergir)
      return await _fallbackValidate(apiKey, res.status);
    }

    const data = (await res.json()) as AsaasAccountResponse;
    return {
      ok: true,
      accountLabel: buildAsaasAccountLabel(data),
      externalAccountId: data.id ? String(data.id) : undefined,
    };
  } catch {
    return {
      ok: false,
      error: "Falha ao conectar com o Asaas. Verifique sua conexão.",
    };
  }
}

async function _fallbackValidate(
  apiKey: string,
  previousStatus: number
): Promise<{ ok: boolean; accountLabel?: string; error?: string }> {
  try {
    const res = await fetch(`${BASE_URL}/customers?limit=1`, {
      method: "GET",
      headers: { access_token: apiKey },
    });
    if (res.status === 401 || res.status === 403) {
      return { ok: false, error: "API Key inválida ou sem permissão." };
    }
    if (res.ok) {
      return { ok: true, accountLabel: "Conta Asaas" };
    }
    return { ok: false, error: `Erro Asaas: HTTP ${previousStatus}` };
  } catch {
    return { ok: false, error: `Erro Asaas: HTTP ${previousStatus}` };
  }
}

/**
 * Lightweight connectivity check used by the job engine (test / sync).
 * Never logs the apiKey.
 */
export async function asaasPing(
  apiKey: string
): Promise<{ ok: boolean; message: string }> {
  try {
    const res = await fetch(`${BASE_URL}/myaccount`, {
      method: "GET",
      headers: { access_token: apiKey, "Content-Type": "application/json" },
    });
    if (res.status === 401 || res.status === 403) {
      return { ok: false, message: "API Key inválida ou sem permissão." };
    }
    if (!res.ok) {
      const fb = await fetch(`${BASE_URL}/customers?limit=1`, {
        method: "GET",
        headers: { access_token: apiKey },
      });
      if (fb.ok) return { ok: true, message: "Conexão Asaas verificada." };
      return { ok: false, message: `Erro Asaas: HTTP ${res.status}` };
    }
    const data = (await res.json()) as AsaasAccountResponse;
    return { ok: true, message: `Conectado: ${buildAsaasAccountLabel(data)}` };
  } catch {
    return { ok: false, message: "Falha ao conectar com o Asaas." };
  }
}

/**
 * Gera um label amigável para exibição na UI.
 */
export function buildAsaasAccountLabel(
  response: AsaasAccountResponse
): string {
  const name =
    response.companyName ??
    response.name ??
    response.email ??
    "Conta Asaas";
  return String(name);
}
