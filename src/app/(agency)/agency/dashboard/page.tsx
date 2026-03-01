import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { clients, deals, tickets } from "@/lib/db/schema";
import { count, eq, and } from "drizzle-orm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, KanbanSquare, TicketIcon, TrendingUp } from "lucide-react";
import { PageContainer } from "@/components/workspace/PageContainer";

export const metadata = {
  title: "Dashboard | Agência",
};

async function getAgencyStats(agencyId: string) {
  const [clientCount] = await db
    .select({ count: count() })
    .from(clients)
    .where(eq(clients.agencyId, agencyId));

  const [dealCount] = await db
    .select({ count: count() })
    .from(deals)
    .where(eq(deals.agencyId, agencyId));

  const [openTicketCount] = await db
    .select({ count: count() })
    .from(tickets)
    .where(and(eq(tickets.agencyId, agencyId), eq(tickets.status, "OPEN")));

  return {
    clients: clientCount.count,
    deals: dealCount.count,
    openTickets: openTicketCount.count,
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
  const agencyId = session?.user.agencyId;

  if (!agencyId) {
    return (
      <div className="p-8">
        <p className="text-muted-foreground">Agência não configurada.</p>
      </div>
    );
  }

  const stats = await getAgencyStats(agencyId);

  return (
    <div className="p-6">
      <PageContainer
        title="Dashboard"
        description={`Bem-vindo de volta, ${session?.user.name ?? ""}`}
      >
      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Clientes</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.clients}</div>
            <p className="text-xs text-muted-foreground">clientes ativos</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Negócios no Pipeline</CardTitle>
            <KanbanSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.deals}</div>
            <p className="text-xs text-muted-foreground">deals ativos</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tickets Abertos</CardTitle>
            <TicketIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.openTickets}</div>
            <p className="text-xs text-muted-foreground">aguardando resposta</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taxa de Conversão</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0%</div>
            <p className="text-xs text-muted-foreground">leads convertidos</p>
          </CardContent>
        </Card>
      </div>

      {/* Pipeline Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Visão do Pipeline</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 overflow-x-auto pb-2">
            {DEAL_STAGES.map((stage) => (
              <div
                key={stage.key}
                className="flex flex-col items-center gap-2 min-w-[100px]"
              >
                <Badge variant={stage.color}>{stage.label}</Badge>
                <span className="text-2xl font-bold">0</span>
                <span className="text-xs text-muted-foreground">negócios</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recent Tickets */}
      <Card>
        <CardHeader>
          <CardTitle>Tickets Recentes</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">
            Nenhum ticket recente.
          </p>
        </CardContent>
      </Card>
      </PageContainer>
    </div>
  );
}
