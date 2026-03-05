import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { deals } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { getActiveAgencyIdOrThrow } from "@/lib/active-context";
import { isFeatureEnabled } from "@/lib/feature-flags/agency-flags";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { PageContainer } from "@/components/workspace/PageContainer";
import { PipelineBoard } from "@/components/crm/PipelineBoard";

export const metadata = {
  title: "Pipeline CRM | Agência",
};

async function getDealsWithClients(agencyId: string) {
  return await db.query.deals.findMany({
    where: eq(deals.agencyId, agencyId),
    with: {
      client: true,
    },
    orderBy: (deals, { desc }) => [desc(deals.createdAt)],
  });
}

export default async function PipelinePage() {
  const agencyId = await getActiveAgencyIdOrThrow();

  if (!await isFeatureEnabled(agencyId, "deals_enabled")) {
    redirect("/agency/dashboard");
  }

  const allDeals = await getDealsWithClients(agencyId);

  return (
    <PageContainer
      title="Pipeline CRM"
      description="Gerencie seus negócios em andamento com drag & drop"
      actions={
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Novo Negócio
        </Button>
      }
    >
      <PipelineBoard initialDeals={allDeals} />
    </PageContainer>
  );
}

