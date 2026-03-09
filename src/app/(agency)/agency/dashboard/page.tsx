import { auth } from "@/lib/auth";
import { getActiveAgencyIdOrThrow } from "@/lib/active-context";
import { db } from "@/lib/db";
import { clients, deals, tickets } from "@/lib/db/schema";
import { count, eq, and, gte, sql, desc, asc } from "drizzle-orm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, KanbanSquare, TicketIcon, TrendingUp } from "lucide-react";
import { PageContainer } from "@/components/workspace/PageContainer";
import { subDays, format } from "date-fns";
import { DashboardCharts } from "@/components/dashboard/DashboardCharts";
import Link from "next/link";
import { AIBriefing } from "@/components/dashboard/AIBriefing";
import { getDealInsights } from "@/lib/crm/crm-intelligence";

export const metadata = {
  title: "Dashboard | Agência",
};

async function getAgencyStats(agencyId: string) {
  const thirtyDaysAgo = subDays(new Date(), 30);

  // 1. Basic Counts
  const [clientCount] = await db
    .select({ count: count() })
    .from(clients)
    .where(eq(clients.agencyId, agencyId));

  const allDeals = await db.query.deals.findMany({
    where: eq(deals.agencyId, agencyId),
    with: { stage: true },
  });

  const dealCount = allDeals.length;

  const [openTicketCount] = await db
    .select({ count: count() })
    .from(tickets)
    .where(and(eq(tickets.agencyId, agencyId), eq(tickets.status, "OPEN")));

  // 2. Conversion Rate (WON / TOTAL)
  const wonDealsCount = allDeals.filter(d => d.status === "CLOSED_WON").length;

  const conversionRate = dealCount > 0
    ? Math.round((wonDealsCount / dealCount) * 100)
    : 0;

  // 3. Deals Trend (Last 30 days)
  const dealsTrendRaw = await db
    .select({
      date: sql<string>`DATE_TRUNC('day', ${deals.createdAt}) as day`,
      count: count(),
    })
    .from(deals)
    .where(and(eq(deals.agencyId, agencyId), gte(deals.createdAt, thirtyDaysAgo)))
    .groupBy(sql`day`)
    .orderBy(asc(sql`day`));

  const dealsTrend = dealsTrendRaw.map(d => ({
    date: format(new Date(d.date), "dd/MM"),
    count: d.count,
  }));

  // 4. Ticket Distribution
  const ticketsStatusRaw = await db
    .select({
      status: tickets.status,
      count: count(),
    })
    .from(tickets)
    .where(eq(tickets.agencyId, agencyId))
    .groupBy(tickets.status);

  const statusLabels: Record<string, string> = {
    OPEN: "Aberto",
    IN_PROGRESS: "Em Progresso",
    WAITING: "Em Espera",
    RESOLVED: "Resolvido",
    CLOSED: "Fechado",
  };

  const ticketsStatus = ticketsStatusRaw.map(t => ({
    name: statusLabels[t.status] || t.status,
    value: t.count,
  }));

  // 5. Pipeline Stages
  const pipelineDataRaw = await db
    .select({
      stageId: deals.stageId,
      count: count(),
    })
    .from(deals)
    .where(eq(deals.agencyId, agencyId))
    .groupBy(deals.stageId);

  const stageLabels: Record<string, string> = {
    LEAD: "Lead",
    QUALIFIED: "Qualificado",
    PROPOSAL: "Proposta",
    NEGOTIATION: "Negociação",
    CLOSED_WON: "Ganho",
    CLOSED_LOST: "Perdido",
  };

  const pipelineData = Object.keys(stageLabels).map(key => {
    const found = pipelineDataRaw.find(p => p.stageId === key);
    return {
      stage: stageLabels[key],
      count: found?.count || 0,
    };
  });

  // 6. Recent Tickets
  const recentTickets = await db.query.tickets.findMany({
    where: eq(tickets.agencyId, agencyId),
    with: { client: true },
    limit: 5,
    orderBy: [desc(tickets.createdAt)],
  });

  // 7. AI Insights
  const aiInsights = allDeals
    .filter(d => d.status === "OPEN")
    .flatMap(d => getDealInsights(d))
    .slice(0, 3);

  return {
    clients: clientCount.count,
    deals: dealCount,
    openTickets: openTicketCount.count,
    conversionRate,
    dealsTrend,
    ticketsStatus,
    pipelineData,
    recentTickets,
    aiInsights,
  };
}

const DEAL_STAGES = [
  { key: "LEAD", label: "Lead", color: "secondary" as const },
  { key: "QUALIFIED", label: "Qualificado", color: "default" as const },
  { key: "PROPOSAL", label: "Proposta", color: "default" as const },
  { key: "NEGOTIATION", label: "Negociação", color: "warning" as const },
  { key: "CLOSED_WON", label: "Ganho", color: "success" as const },
  { key: "CLOSED_LOST", label: "Perdido", color: "destructive" as const },
];

export default async function AgencyDashboard() {
  const session = await auth();

  let agencyId: string;
  try {
    agencyId = await getActiveAgencyIdOrThrow();
  } catch {
    return (
      <div className="p-8">
        <p className="text-muted-foreground">Agência não configurada.</p>
      </div>
    );
  }

  const stats = await getAgencyStats(agencyId);

  return (
    <div className="p-6 animate-fade-in-up">
      <PageContainer
        title="Dashboard"
        description={`Bem-vindo de volta, ${session?.user.name ?? ""}`}
        className="animate-fade-in-up"
      >
        <AIBriefing userName={session?.user.name ?? ""} insights={stats.aiInsights} />

        <div className="space-y-8">
          {/* Stats Grid */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card className="glass-card hover-lift border-primary/20 bg-primary/5">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-semibold tracking-tight">Total de Clientes</CardTitle>
                <Users className="h-4 w-4 text-primary animate-pulse-soft" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-extrabold tracking-tight">{stats.clients}</div>
                <p className="text-[10px] text-muted-foreground mt-1 uppercase font-bold tracking-wider">clientes ativos</p>
              </CardContent>
            </Card>

            <Card className="glass-card hover-lift">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-semibold tracking-tight">Negócios no Pipeline</CardTitle>
                <KanbanSquare className="h-4 w-4 text-azure-600 animate-pulse-soft" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-extrabold tracking-tight">{stats.deals}</div>
                <p className="text-[10px] text-muted-foreground mt-1 uppercase font-bold tracking-wider">deals ativos</p>
              </CardContent>
            </Card>

            <Card className="glass-card hover-lift">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-semibold tracking-tight">Tickets Abertos</CardTitle>
                <TicketIcon className="h-4 w-4 text-orange-500 animate-pulse-soft" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-extrabold tracking-tight">{stats.openTickets}</div>
                <p className="text-[10px] text-muted-foreground mt-1 uppercase font-bold tracking-wider">aguardando resposta</p>
              </CardContent>
            </Card>

            <Card className="glass-card hover-lift bg-green-50/30 border-green-200/50">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-semibold tracking-tight">Taxa de Conversão</CardTitle>
                <TrendingUp className="h-4 w-4 text-green-600 animate-pulse-soft" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-extrabold tracking-tight">{stats.conversionRate}%</div>
                <p className="text-[10px] text-muted-foreground mt-1 uppercase font-bold tracking-wider">leads convertidos</p>
              </CardContent>
            </Card>
          </div>

          {/* New Charts Section */}
          <DashboardCharts
            dealsTrend={stats.dealsTrend}
            ticketsStatus={stats.ticketsStatus}
            pipelineData={stats.pipelineData}
          />

          <div className="grid gap-6 md:grid-cols-2">
            {/* Pipeline Overview */}
            <Card>
              <CardHeader>
                <CardTitle>Visão Geral do Pipeline</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4">
                  {DEAL_STAGES.map((stage) => {
                    const stageData = stats.pipelineData.find(p => p.stage === stage.label);
                    return (
                      <div
                        key={stage.key}
                        className="flex flex-col items-center gap-1 p-2 border rounded-lg bg-muted/20"
                      >
                        <Badge variant={stage.color} className="scale-75 origin-top">
                          {stage.label}
                        </Badge>
                        <span className="text-xl font-bold">{stageData?.count || 0}</span>
                        <span className="text-[10px] text-muted-foreground uppercase font-semibold">
                          Negócios
                        </span>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Recent Tickets */}
            <Card>
              <CardHeader>
                <CardTitle>Tickets Recentes</CardTitle>
              </CardHeader>
              <CardContent>
                {stats.recentTickets.length === 0 ? (
                  <p className="text-muted-foreground text-sm">
                    Nenhum ticket recente.
                  </p>
                ) : (
                  <div className="space-y-4">
                    {stats.recentTickets.map((ticket) => (
                      <Link
                        key={ticket.id}
                        href={`/agency/tickets?ticketId=${ticket.id}`}
                        className="flex items-center justify-between border-b pb-2 last:border-0 last:pb-0 hover:bg-muted/50 transition-colors rounded-md px-2 -mx-2 py-2 group"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium truncate group-hover:text-primary transition-colors">{ticket.subject}</p>
                          <p className="text-xs text-muted-foreground">
                            {ticket.client?.name} • {format(new Date(ticket.createdAt), "dd/MM/yy")}
                          </p>
                        </div>
                        <Badge variant="outline" className="ml-2 text-[10px]">
                          {ticket.status}
                        </Badge>
                      </Link>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </PageContainer>
    </div>
  );
}

