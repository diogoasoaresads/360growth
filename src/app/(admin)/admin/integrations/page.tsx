import { PageContainer } from "@/components/workspace/PageContainer";
import { AdminIntegrationsClient } from "@/components/admin/AdminIntegrationsClient";
import { getAdminIntegrations, getIntegrationStats } from "@/lib/actions/admin/integrations";

export const metadata = {
    title: "Gestão de Integrações | Admin",
};

export default async function AdminIntegrationsPage() {
    const integrations = await getAdminIntegrations();
    const stats = await getIntegrationStats();

    return (
        <PageContainer
            title="Centro de Integrações"
            description="Visão consolidada de todas as conexões ativas na plataforma."
        >
            <AdminIntegrationsClient
                initialIntegrations={integrations}
                stats={stats}
            />
        </PageContainer>
    );
}
