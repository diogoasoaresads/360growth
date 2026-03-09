import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { deals, clients } from "@/lib/db/schema";
import { eq, and, asc } from "drizzle-orm";
import { getActiveAgencyIdOrThrow } from "@/lib/active-context";
import { isFeatureEnabled } from "@/lib/feature-flags/agency-flags";
import { Button } from "@/components/ui/button";
import { Plus, Settings2, BarChart3 } from "lucide-react";
import Link from "next/link";
import { PageContainer } from "@/components/workspace/PageContainer";
import { PipelineBoard } from "@/components/crm/PipelineBoard";
import type { Deal, Client, User } from "@/lib/db/schema";
import { CRMSelector } from "@/components/crm/CRMSelector";
import { createPipeline, getPipelines } from "@/lib/actions/pipeline.actions";

export const metadata = {
  title: "CRM | 360growth",
};

interface DealWithClient extends Deal {
  client: Client | null;
  responsible: User | null;
}

export default async function PipelinePage({
  searchParams,
}: {
  searchParams: { clientId?: string; pipelineId?: string };
}) {
  const agencyId = await getActiveAgencyIdOrThrow();

  if (!await isFeatureEnabled(agencyId, "deals_enabled")) {
    redirect("/agency/dashboard");
  }

  // 1. Get Clients
  const allClients = await db.query.clients.findMany({
    where: eq(clients.agencyId, agencyId),
    orderBy: [asc(clients.name)],
  });

  const activeClientId = searchParams.clientId || allClients[0]?.id;

  // 2. Get Pipelines for active client
  let clientPipelines = activeClientId ? await getPipelines(activeClientId) : [];

  // 3. Fallback: Create default pipeline if none exists for client
  if (activeClientId && clientPipelines.length === 0) {
    await createPipeline(activeClientId, "Pipeline Principal", "AGENCY");
    clientPipelines = await getPipelines(activeClientId);
  }

  const activePipelineId = searchParams.pipelineId || clientPipelines[0]?.id;
  const activePipeline = clientPipelines.find(p => p.id === activePipelineId);

  // 4. Get Deals for active pipeline
  const pipelineDeals = activePipelineId ? await db.query.deals.findMany({
    where: and(
      eq(deals.agencyId, agencyId),
      eq(deals.pipelineId, activePipelineId)
    ),
    with: {
      client: true,
      responsible: true,
    },
    orderBy: (deals, { desc }) => [desc(deals.createdAt)],
  }) : [];

  return (
    <PageContainer
      title="Pipeline CRM"
      description="Gerencie seus negócios e funis de forma estratégica"
      className="animate-fade-in-up"
      actions={
        <div className="flex items-center gap-2">
          <Link href="/agency/crm/analytics">
            <Button variant="outline" size="sm" className="rounded-full hover:bg-primary hover:text-white transition-premium group shadow-sm">
              <BarChart3 className="mr-2 h-4 w-4 group-hover:scale-110 transition-transform" />
              Relatórios & Insights
            </Button>
          </Link>
          <Button variant="outline" size="sm" className="rounded-full transition-premium shadow-sm">
            <Settings2 className="mr-2 h-4 w-4" />
            Configurar Pipeline
          </Button>
          <Button size="sm" className="rounded-full bg-primary hover:bg-primary/90 transition-premium shadow-md">
            <Plus className="mr-2 h-4 w-4" />
            Novo Negócio
          </Button>
        </div>
      }
    >
      <div className="flex flex-col gap-6">
        {/* Filters Header */}
        <div className="flex items-center gap-4 glass-card p-5 rounded-2xl border-none shadow-2xl shadow-slate-200/50">
          <CRMSelector
            items={allClients}
            defaultValue={activeClientId}
            paramName="clientId"
            label="Cliente"
            placeholder="Selecione o Cliente"
          />

          <CRMSelector
            items={clientPipelines}
            defaultValue={activePipelineId}
            paramName="pipelineId"
            label="Pipeline"
            placeholder="Selecione a Pipeline"
          />

          <div className="ml-auto flex items-center gap-2">
            {/* Basic metrics can go here */}
            <div className="px-5 py-2.5 bg-primary/5 rounded-xl border border-primary/10 shadow-inner">
              <p className="text-[10px] font-extrabold text-primary uppercase tracking-widest mb-0.5">Total em Aberto</p>
              <p className="text-lg font-extrabold tracking-tight">
                {pipelineDeals.reduce((acc, d) => acc + Number(d.value || 0), 0)
                  .toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              </p>
            </div>
          </div>
        </div>

        <PipelineBoard
          initialDeals={pipelineDeals as DealWithClient[]}
          stages={activePipeline?.stages || []}
        />
      </div>
    </PageContainer>
  );
}

