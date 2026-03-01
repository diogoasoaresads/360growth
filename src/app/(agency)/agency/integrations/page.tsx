import type { Metadata } from "next";
import { listIntegrations } from "@/lib/actions/agency/integrations";
import { IntegrationsClient } from "./integrations-client";
import { PageContainer } from "@/components/workspace/PageContainer";

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
    <div className="p-6">
      <PageContainer
        title="Integrações"
        description="Conecte serviços externos à sua agência. Credenciais são criptografadas (AES-256-GCM) e armazenadas com segurança."
      >
        <IntegrationsClient
          integrations={integrations}
          connected={searchParams.connected}
          oauthError={searchParams.oauth_error}
        />
      </PageContainer>
    </div>
  );
}
