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
import { cn } from "@/lib/utils";

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


  return (
    <div className="p-6 animate-fade-in-up">
      <PageContainer
        title="Meu Portal"
        description={`Bem-vindo, ${session?.user.name ?? ""}. Aqui está o resumo das suas entregas.`}
      >
        <div className="grid gap-4 md:grid-cols-4 mb-8">
          <Card className="glass-card hover-lift border-primary/20 bg-primary/5">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-semibold tracking-tight">Projetos Ativos</CardTitle>
              <Briefcase className="h-4 w-4 text-primary animate-pulse-soft" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-extrabold tracking-tight">{stats.dealCount}</div>
              <p className="text-[10px] text-muted-foreground mt-1 uppercase font-bold tracking-wider">Acompanhe em tempo real</p>
            </CardContent>
          </Card>

          <Card className="glass-card hover-lift">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-semibold tracking-tight">Tickets em Aberto</CardTitle>
              <TicketIcon className="h-4 w-4 text-orange-500 animate-pulse-soft" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-extrabold tracking-tight">{stats.openCount}</div>
              <p className="text-[10px] text-muted-foreground mt-1 uppercase font-bold tracking-wider">Aguardando resposta</p>
            </CardContent>
          </Card>

          <Card className="glass-card hover-lift">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-semibold tracking-tight">Chamados Resolvidos</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-500 animate-pulse-soft" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-extrabold tracking-tight">{stats.resolvedCount}</div>
              <p className="text-[10px] text-muted-foreground mt-1 uppercase font-bold tracking-wider">Concluídos com sucesso</p>
            </CardContent>
          </Card>

          <Card className="glass-card hover-lift border-azure-200/50 bg-azure-50/30">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-semibold tracking-tight">Minha Empresa</CardTitle>
              <Clock className="h-4 w-4 text-azure-600 animate-pulse-soft" />
            </CardHeader>
            <CardContent>
              <div className="text-xl font-extrabold tracking-tight truncate">{stats.client.company ?? stats.client.name}</div>
              <p className="text-[10px] text-muted-foreground mt-1 uppercase font-bold tracking-wider">Perfil verificado</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Projetos Recentes */}
          <Card className="flex flex-col glass-card border-none shadow-2xl shadow-slate-200/50">
            <CardHeader className="flex flex-row items-center justify-between border-b border-slate-100/50 pb-4">
              <div>
                <CardTitle className="text-lg font-bold tracking-tight">Projetos em Andamento</CardTitle>
                <CardDescription className="text-xs">Status atual das suas iniciativas comerciais.</CardDescription>
              </div>
              <Button variant="outline" size="sm" asChild className="rounded-full hover:bg-primary hover:text-white transition-premium">
                <Link href="/portal/projects" className="text-xs gap-1">
                  Ver todos <ArrowRight className="h-3 w-3" />
                </Link>
              </Button>
            </CardHeader>
            <CardContent className="flex-1 pt-6">
              {stats.activeDeals.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-6 border-2 border-dashed rounded-xl bg-slate-50/50">
                  <Briefcase className="h-8 w-8 text-muted-foreground/20 mb-2 animate-float" />
                  <p className="text-sm text-muted-foreground">Nenhum projeto ativo no momento.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {stats.activeDeals.map((deal) => (
                    <Link
                      key={deal.id}
                      href={`/portal/projects?dealId=${deal.id}`}
                      className="group relative block rounded-xl border border-slate-100 p-4 hover:border-primary/30 hover:bg-primary/5 transition-premium shadow-sm hover:shadow-md"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-bold text-sm group-hover:text-primary transition-colors tracking-tight">{deal.title}</h4>
                        <Badge variant="secondary" className="text-[9px] uppercase font-extrabold tracking-widest px-2 py-0.5 bg-slate-100 group-hover:bg-primary group-hover:text-white transition-premium">
                          {deal.status === "OPEN" ? "Em Andamento" : deal.status}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 text-[11px] text-muted-foreground">
                        <span className="flex items-center gap-1 font-medium">
                          <Clock className="h-3 w-3" /> {new Date(deal.createdAt).toLocaleDateString("pt-BR")}
                        </span>
                        {deal.value && (
                          <span className="font-extrabold text-foreground">
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
          <Card className="flex flex-col glass-card border-none shadow-2xl shadow-slate-200/50">
            <CardHeader className="flex flex-row items-center justify-between border-b border-slate-100/50 pb-4">
              <div>
                <CardTitle className="text-lg font-bold tracking-tight">Suporte Recente</CardTitle>
                <CardDescription className="text-xs">Últimos chamados abertos por você.</CardDescription>
              </div>
              <Button variant="outline" size="sm" asChild className="rounded-full hover:bg-orange-500 hover:text-white transition-premium group">
                <Link href="/portal/tickets" className="text-xs gap-1">
                  Abrir Ticket <ArrowRight className="h-3 w-3 group-hover:translate-x-1 transition-transform" />
                </Link>
              </Button>
            </CardHeader>
            <CardContent className="flex-1 pt-6">
              {stats.recentTickets.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-6 border-2 border-dashed rounded-xl bg-slate-50/50">
                  <TicketIcon className="h-8 w-8 text-muted-foreground/20 mb-2 animate-float" />
                  <p className="text-sm text-muted-foreground">Tudo em ordem por aqui.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {stats.recentTickets.map((ticket) => (
                    <div key={ticket.id} className="flex items-center justify-between p-4 rounded-xl border border-slate-100 hover:border-orange-200/50 hover:bg-orange-50/30 transition-premium cursor-pointer group shadow-sm hover:shadow-md">
                      <div className="space-y-1">
                        <p className="font-bold text-sm group-hover:text-orange-600 transition-colors tracking-tight">{ticket.subject}</p>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-extrabold flex items-center gap-2">
                          <span className={cn(
                            "h-1.5 w-1.5 rounded-full shrink-0 animate-pulse",
                            ticket.priority === "HIGH" ? "bg-red-500" : "bg-blue-500"
                          )} />
                          {ticket.priority} • {new Date(ticket.createdAt).toLocaleDateString("pt-BR")}
                        </p>
                      </div>
                      <Badge variant={ticket.status === "OPEN" ? "default" : "secondary"} className={cn(
                        "text-[9px] uppercase font-extrabold tracking-widest px-2",
                        ticket.status === "OPEN" ? "bg-orange-500 hover:bg-orange-600" : "bg-slate-100"
                      )}>
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
