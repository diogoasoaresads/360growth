import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { tickets, clients, userContexts, deals } from "@/lib/db/schema";
import { eq, and, count, desc } from "drizzle-orm";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TicketIcon, CheckCircle, Briefcase, Clock, ArrowRight } from "lucide-react";
import { PageContainer } from "@/components/workspace/PageContainer";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export const metadata = {
  title: "Dashboard | Portal do Cliente",
};

async function getClientStats(clientId: string) {
  const client = await db.query.clients.findFirst({
    where: eq(clients.id, clientId),
  });

  if (!client) return null;

  const [openCount] = await db
    .select({ count: count() })
    .from(tickets)
    .where(and(eq(tickets.clientId, client.id), eq(tickets.status, "OPEN")));

  const [resolvedCount] = await db
    .select({ count: count() })
    .from(tickets)
    .where(and(eq(tickets.clientId, client.id), eq(tickets.status, "RESOLVED")));

  const [dealCount] = await db
    .select({ count: count() })
    .from(deals)
    .where(eq(deals.clientId, client.id));

  const recentTickets = await db.query.tickets.findMany({
    where: eq(tickets.clientId, client.id),
    orderBy: [desc(tickets.createdAt)],
    limit: 3,
  });

  const activeDeals = await db.query.deals.findMany({
    where: eq(deals.clientId, client.id),
    orderBy: [desc(deals.updatedAt)],
    limit: 3,
  });

  return { client, openCount: openCount.count, resolvedCount: resolvedCount.count, dealCount: dealCount.count, recentTickets, activeDeals };
}

export default async function PortalDashboard() {
  const session = await auth();

  // Resolve the clientId: for SUPER_ADMIN use activeClientId from user_contexts,
  // for CLIENT look up by userId (portal layout already validates both paths).
  let clientId: string | null = null;
  if (session!.user.role === "SUPER_ADMIN") {
    const [ctx] = await db
      .select({ clientId: userContexts.activeClientId })
      .from(userContexts)
      .where(eq(userContexts.userId, session!.user.id))
      .limit(1);
    clientId = ctx?.clientId ?? null;
  } else {
    const clientRecord = await db.query.clients.findFirst({
      where: eq(clients.userId, session!.user.id),
      columns: { id: true },
    });
    clientId = clientRecord?.id ?? null;
  }

  const stats = clientId ? await getClientStats(clientId) : null;

  if (!stats) {
    return (
      <div className="p-8">
        <div className="text-center">
          <p className="text-muted-foreground">
            Seu perfil de cliente ainda não foi configurado. Entre em contato com sua agência.
          </p>
        </div>
      </div>
    );
  }

  const stageLabels: Record<string, string> = {
    LEAD: "Lead",
    QUALIFIED: "Qualificado",
    PROPOSAL: "Proposta",
    NEGOTIATION: "Negociação",
    CLOSED_WON: "Ganho",
    CLOSED_LOST: "Perdido",
  };

  return (
    <div className="p-6">
      <PageContainer
        title="Meu Portal"
        description={`Bem-vindo, ${session?.user.name ?? ""}. Aqui está o resumo das suas entregas.`}
      >
        <div className="grid gap-4 md:grid-cols-4 mb-8">
          <Card className="bg-primary/5 border-primary/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Projetos Ativos</CardTitle>
              <Briefcase className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.dealCount}</div>
              <p className="text-xs text-muted-foreground mt-1">Acompanhe o progresso em tempo real</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tickets em Aberto</CardTitle>
              <TicketIcon className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.openCount}</div>
              <p className="text-xs text-muted-foreground mt-1">Chamados aguardando resposta</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Chamados Resolvidos</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.resolvedCount}</div>
              <p className="text-xs text-muted-foreground mt-1">Concluídos com sucesso</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Minha Empresa</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-lg font-bold truncate">{stats.client.company ?? stats.client.name}</div>
              <p className="text-xs text-muted-foreground mt-1">Perfil verificado</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Projetos Recentes */}
          <Card className="flex flex-col">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Projetos em Andamento</CardTitle>
                <CardDescription>Status atual das suas iniciativas.</CardDescription>
              </div>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/portal/projects" className="text-xs gap-1">
                  Ver todos <ArrowRight className="h-3 w-3" />
                </Link>
              </Button>
            </CardHeader>
            <CardContent className="flex-1">
              {stats.activeDeals.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-6 border-2 border-dashed rounded-lg">
                  <Briefcase className="h-8 w-8 text-muted-foreground/20 mb-2" />
                  <p className="text-sm text-muted-foreground">Nenhum projeto ativo no momento.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {stats.activeDeals.map((deal) => (
                    <Link
                      key={deal.id}
                      href={`/portal/projects?dealId=${deal.id}`}
                      className="group relative block rounded-lg border p-4 hover:border-primary/50 transition-colors"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-semibold text-sm group-hover:text-primary transition-colors">{deal.title}</h4>
                        <Badge variant="outline" className="text-[10px] uppercase">
                          {stageLabels[deal.stage] || deal.stage}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" /> {new Date(deal.createdAt).toLocaleDateString("pt-BR")}
                        </span>
                        {deal.value && (
                          <span className="font-medium text-foreground">
                            {Number(deal.value).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                          </span>
                        )}
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Tickets Recentes */}
          <Card className="flex flex-col">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Suporte Recente</CardTitle>
                <CardDescription>Últimos chamados abertos por você.</CardDescription>
              </div>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/portal/tickets" className="text-xs gap-1">
                  Abrir Ticket <ArrowRight className="h-3 w-3" />
                </Link>
              </Button>
            </CardHeader>
            <CardContent className="flex-1">
              {stats.recentTickets.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-6 border-2 border-dashed rounded-lg">
                  <TicketIcon className="h-8 w-8 text-muted-foreground/20 mb-2" />
                  <p className="text-sm text-muted-foreground">Tudo em ordem por aqui.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {stats.recentTickets.map((ticket) => (
                    <div key={ticket.id} className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors cursor-pointer group">
                      <div className="space-y-1">
                        <p className="font-medium text-sm group-hover:text-primary transition-colors">{ticket.subject}</p>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-mono">
                          {ticket.priority} • {new Date(ticket.createdAt).toLocaleDateString("pt-BR")}
                        </p>
                      </div>
                      <Badge variant={ticket.status === "OPEN" ? "default" : "secondary"} className="text-[10px]">
                        {ticket.status === "OPEN" ? "Aberto" : ticket.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </PageContainer>
    </div>
  );
}
