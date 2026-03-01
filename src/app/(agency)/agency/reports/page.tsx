import { db } from "@/lib/db";
import { clients, deals, tickets, contacts } from "@/lib/db/schema";
import { count, eq, and, sum } from "drizzle-orm";
import { getActiveAgencyIdOrThrow } from "@/lib/active-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Users,
  KanbanSquare,
  TicketIcon,
  TrendingUp,
  CheckCircle2,
  XCircle,
  Clock,
} from "lucide-react";
import type { DealStage, TicketStatus, TicketPriority } from "@/lib/db/schema";
import { PageContainer } from "@/components/workspace/PageContainer";

export const metadata = {
  title: "Relatórios | Agência",
};

const DEAL_STAGES: { key: DealStage; label: string }[] = [
  { key: "LEAD", label: "Lead" },
  { key: "QUALIFIED", label: "Qualificado" },
  { key: "PROPOSAL", label: "Proposta" },
  { key: "NEGOTIATION", label: "Negociação" },
  { key: "CLOSED_WON", label: "Ganho" },
  { key: "CLOSED_LOST", label: "Perdido" },
];

const TICKET_STATUSES: { key: TicketStatus; label: string; variant: "default" | "secondary" | "destructive" | "outline" | "success" | "warning" }[] = [
  { key: "OPEN", label: "Abertos", variant: "default" },
  { key: "IN_PROGRESS", label: "Em Progresso", variant: "warning" },
  { key: "WAITING", label: "Aguardando", variant: "secondary" },
  { key: "RESOLVED", label: "Resolvidos", variant: "success" },
  { key: "CLOSED", label: "Fechados", variant: "outline" },
];

const TICKET_PRIORITIES: { key: TicketPriority; label: string; variant: "default" | "secondary" | "destructive" | "outline" | "warning" }[] = [
  { key: "LOW", label: "Baixa", variant: "secondary" },
  { key: "MEDIUM", label: "Média", variant: "default" },
  { key: "HIGH", label: "Alta", variant: "warning" },
  { key: "URGENT", label: "Urgente", variant: "destructive" },
];

async function getReportData(agencyId: string) {
  const [clientCount] = await db
    .select({ count: count() })
    .from(clients)
    .where(eq(clients.agencyId, agencyId));

  const [activeClientCount] = await db
    .select({ count: count() })
    .from(clients)
    .where(and(eq(clients.agencyId, agencyId), eq(clients.status, "active")));

  const [contactCount] = await db
    .select({ count: count() })
    .from(contacts)
    .where(eq(contacts.agencyId, agencyId));

  // Deals by stage
  const dealsByStage = await db
    .select({
      stage: deals.stage,
      count: count(),
      totalValue: sum(deals.value),
    })
    .from(deals)
    .where(eq(deals.agencyId, agencyId))
    .groupBy(deals.stage);

  const wonDeals = dealsByStage.find((d) => d.stage === "CLOSED_WON");
  const lostDeals = dealsByStage.find((d) => d.stage === "CLOSED_LOST");
  const totalDeals = dealsByStage.reduce((s, d) => s + d.count, 0);
  const wonValue = parseFloat(wonDeals?.totalValue ?? "0");
  const conversionRate =
    totalDeals > 0
      ? Math.round(((wonDeals?.count ?? 0) / totalDeals) * 100)
      : 0;

  // Tickets by status
  const ticketsByStatus = await db
    .select({ status: tickets.status, count: count() })
    .from(tickets)
    .where(eq(tickets.agencyId, agencyId))
    .groupBy(tickets.status);

  // Tickets by priority
  const ticketsByPriority = await db
    .select({ priority: tickets.priority, count: count() })
    .from(tickets)
    .where(eq(tickets.agencyId, agencyId))
    .groupBy(tickets.priority);

  const totalTickets = ticketsByStatus.reduce((s, t) => s + t.count, 0);
  const resolvedTickets =
    (ticketsByStatus.find((t) => t.status === "RESOLVED")?.count ?? 0) +
    (ticketsByStatus.find((t) => t.status === "CLOSED")?.count ?? 0);
  const resolutionRate =
    totalTickets > 0 ? Math.round((resolvedTickets / totalTickets) * 100) : 0;

  return {
    clients: { total: clientCount.count, active: activeClientCount.count },
    contacts: contactCount.count,
    deals: {
      byStage: dealsByStage,
      total: totalDeals,
      won: wonDeals?.count ?? 0,
      lost: lostDeals?.count ?? 0,
      wonValue,
      conversionRate,
    },
    tickets: {
      byStatus: ticketsByStatus,
      byPriority: ticketsByPriority,
      total: totalTickets,
      resolved: resolvedTickets,
      resolutionRate,
    },
  };
}

function formatCurrency(value: number) {
  return value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
  });
}

export default async function ReportsPage() {
  const agencyId = await getActiveAgencyIdOrThrow();
  const data = await getReportData(agencyId);

  return (
    <div className="p-6">
      <PageContainer
        title="Relatórios"
        description="Visão geral do desempenho da sua agência"
      >
      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Clientes</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.clients.total}</div>
            <p className="text-xs text-muted-foreground">
              {data.clients.active} ativos · {data.clients.total - data.clients.active} inativos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Receita Fechada</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(data.deals.wonValue)}</div>
            <p className="text-xs text-muted-foreground">
              {data.deals.won} negócio{data.deals.won !== 1 ? "s" : ""} ganho{data.deals.won !== 1 ? "s" : ""}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taxa de Conversão</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.deals.conversionRate}%</div>
            <p className="text-xs text-muted-foreground">
              {data.deals.total} negócios no total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Resolução de Tickets</CardTitle>
            <TicketIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.tickets.resolutionRate}%</div>
            <p className="text-xs text-muted-foreground">
              {data.tickets.resolved} de {data.tickets.total} resolvidos
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Pipeline por Estágio */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <KanbanSquare className="h-4 w-4 text-muted-foreground" />
              <CardTitle className="text-base">Pipeline por Estágio</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.deals.total === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                Nenhum negócio cadastrado
              </p>
            ) : (
              DEAL_STAGES.map((stage) => {
                const stageData = data.deals.byStage.find(
                  (d) => d.stage === stage.key
                );
                const stageCount = stageData?.count ?? 0;
                const stageValue = parseFloat(stageData?.totalValue ?? "0");
                const pct =
                  data.deals.total > 0
                    ? Math.round((stageCount / data.deals.total) * 100)
                    : 0;
                return (
                  <div key={stage.key} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">{stage.label}</span>
                      <div className="flex items-center gap-3 text-muted-foreground">
                        {stageValue > 0 && (
                          <span>{formatCurrency(stageValue)}</span>
                        )}
                        <span>{stageCount} negócio{stageCount !== 1 ? "s" : ""}</span>
                        <span className="w-8 text-right">{pct}%</span>
                      </div>
                    </div>
                    <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                      <div
                        className={
                          stage.key === "CLOSED_WON"
                            ? "h-full bg-green-500 rounded-full"
                            : stage.key === "CLOSED_LOST"
                            ? "h-full bg-red-400 rounded-full"
                            : "h-full bg-primary rounded-full"
                        }
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>

        {/* Tickets por Status */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <TicketIcon className="h-4 w-4 text-muted-foreground" />
              <CardTitle className="text-base">Tickets por Status</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.tickets.total === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                Nenhum ticket cadastrado
              </p>
            ) : (
              TICKET_STATUSES.map((status) => {
                const statusData = data.tickets.byStatus.find(
                  (t) => t.status === status.key
                );
                const statusCount = statusData?.count ?? 0;
                const pct =
                  data.tickets.total > 0
                    ? Math.round((statusCount / data.tickets.total) * 100)
                    : 0;
                return (
                  <div key={status.key} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge variant={status.variant} className="text-xs w-28 justify-center">
                        {status.label}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-32 h-1.5 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary rounded-full"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="text-sm text-muted-foreground w-16 text-right">
                        {statusCount} ({pct}%)
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>
      </div>

      {/* Tickets por Prioridade + Resumo CRM */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <CardTitle className="text-base">Tickets por Prioridade</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            {data.tickets.total === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                Nenhum ticket cadastrado
              </p>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {TICKET_PRIORITIES.map((priority) => {
                  const priorityData = data.tickets.byPriority.find(
                    (t) => t.priority === priority.key
                  );
                  const priorityCount = priorityData?.count ?? 0;
                  return (
                    <div
                      key={priority.key}
                      className="flex flex-col items-center justify-center rounded-lg border p-4 gap-1"
                    >
                      <Badge variant={priority.variant} className="text-xs">
                        {priority.label}
                      </Badge>
                      <span className="text-2xl font-bold">{priorityCount}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <CardTitle className="text-base">Resumo CRM</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between py-3 border-b">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">Clientes Ativos</span>
              </div>
              <span className="font-bold">{data.clients.active}</span>
            </div>
            <div className="flex items-center justify-between py-3 border-b">
              <div className="flex items-center gap-2">
                <XCircle className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">Clientes Inativos</span>
              </div>
              <span className="font-bold">{data.clients.total - data.clients.active}</span>
            </div>
            <div className="flex items-center justify-between py-3 border-b">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">Total de Contatos</span>
              </div>
              <span className="font-bold">{data.contacts}</span>
            </div>
            <div className="flex items-center justify-between py-3">
              <div className="flex items-center gap-2">
                <KanbanSquare className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">Negócios Perdidos</span>
              </div>
              <span className="font-bold">{data.deals.lost}</span>
            </div>
          </CardContent>
        </Card>
      </div>
      </PageContainer>
    </div>
  );
}
