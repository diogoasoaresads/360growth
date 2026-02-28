import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { deals } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { getActiveAgencyIdOrThrow } from "@/lib/active-context";
import { isFeatureEnabled } from "@/lib/feature-flags/agency-flags";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import type { DealStage } from "@/lib/db/schema";

export const metadata = {
  title: "Pipeline CRM | Agência",
};

const STAGES: { key: DealStage; label: string; color: string }[] = [
  { key: "LEAD", label: "Lead", color: "bg-slate-100 border-slate-200" },
  { key: "QUALIFIED", label: "Qualificado", color: "bg-blue-50 border-blue-200" },
  { key: "PROPOSAL", label: "Proposta", color: "bg-purple-50 border-purple-200" },
  { key: "NEGOTIATION", label: "Negociação", color: "bg-amber-50 border-amber-200" },
  { key: "CLOSED_WON", label: "Ganho", color: "bg-green-50 border-green-200" },
  { key: "CLOSED_LOST", label: "Perdido", color: "bg-red-50 border-red-200" },
];

async function getDealsWithClients(agencyId: string) {
  const result = await db.query.deals.findMany({
    where: eq(deals.agencyId, agencyId),
    with: {
      client: true,
    },
    orderBy: (deals, { desc }) => [desc(deals.createdAt)],
  });
  return result;
}

export default async function PipelinePage() {
  const agencyId = await getActiveAgencyIdOrThrow();

  if (!await isFeatureEnabled(agencyId, "deals_enabled")) {
    redirect("/agency/dashboard");
  }

  const allDeals = await getDealsWithClients(agencyId);

  const dealsByStage = STAGES.reduce(
    (acc, stage) => {
      acc[stage.key] = allDeals.filter((d) => d.stage === stage.key);
      return acc;
    },
    {} as Record<DealStage, typeof allDeals>
  );

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Pipeline CRM</h1>
          <p className="text-muted-foreground mt-1">Gerencie seus negócios em andamento</p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Novo Negócio
        </Button>
      </div>

      {/* Kanban Board */}
      <div className="flex gap-4 overflow-x-auto pb-4">
        {STAGES.map((stage) => {
          const stageDeals = dealsByStage[stage.key] ?? [];
          const totalValue = stageDeals.reduce(
            (sum, d) => sum + parseFloat(d.value ?? "0"),
            0
          );

          return (
            <div
              key={stage.key}
              className={`flex-shrink-0 w-72 rounded-xl border-2 ${stage.color} p-3`}
            >
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-sm">{stage.label}</h3>
                  <p className="text-xs text-muted-foreground">
                    {stageDeals.length} negócio{stageDeals.length !== 1 ? "s" : ""}
                  </p>
                </div>
                {totalValue > 0 && (
                  <Badge variant="outline" className="text-xs">
                    R$ {totalValue.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                  </Badge>
                )}
              </div>

              <div className="space-y-2 min-h-[200px]">
                {stageDeals.length === 0 ? (
                  <div className="flex items-center justify-center h-24 rounded-lg border-2 border-dashed border-muted-foreground/20">
                    <p className="text-xs text-muted-foreground">Nenhum negócio</p>
                  </div>
                ) : (
                  stageDeals.map((deal) => (
                    <Card key={deal.id} className="shadow-sm cursor-pointer hover:shadow-md transition-shadow">
                      <CardContent className="p-3">
                        <p className="font-medium text-sm">{deal.title}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {(deal as { client?: { name?: string } }).client?.name ?? "Cliente não encontrado"}
                        </p>
                        {deal.value && (
                          <p className="text-sm font-semibold text-primary mt-2">
                            R$ {parseFloat(deal.value).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
