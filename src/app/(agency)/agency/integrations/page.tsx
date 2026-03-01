import type { Metadata } from "next";
import { listIntegrations } from "@/lib/actions/agency/integrations";
import { IntegrationsClient } from "./integrations-client";

export const metadata: Metadata = {
  title: "Integrações",
};

export default async function IntegrationsPage({
  searchParams,
}: {
  searchParams: { connected?: string; oauth_error?: string };
}) {
  const integrations = await listIntegrations();

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Integrações</h1>
        <p className="text-muted-foreground mt-1">
          Conecte serviços externos à sua agência. Credenciais são criptografadas
          (AES-256-GCM) e armazenadas com segurança — nunca em variáveis de
          ambiente por agência.
        </p>
      </div>

      <IntegrationsClient
        integrations={integrations}
        connected={searchParams.connected}
        oauthError={searchParams.oauth_error}
      />
    </div>
  );
}
