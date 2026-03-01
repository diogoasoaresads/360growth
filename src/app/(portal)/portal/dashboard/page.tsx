import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { tickets, clients, userContexts } from "@/lib/db/schema";
import { eq, and, count } from "drizzle-orm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TicketIcon, CheckCircle, Clock } from "lucide-react";
import { PageContainer } from "@/components/workspace/PageContainer";

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

  const recentTickets = await db.query.tickets.findMany({
    where: eq(tickets.clientId, client.id),
    orderBy: (tickets, { desc }) => [desc(tickets.createdAt)],
    limit: 5,
  });

  return { client, openCount: openCount.count, resolvedCount: resolvedCount.count, recentTickets };
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
    <div className="p-6">
      <PageContainer
        title="Meu Portal"
        description={`Bem-vindo, ${session?.user.name ?? ""}`}
      >
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tickets Abertos</CardTitle>
            <TicketIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.openCount}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Resolvidos</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.resolvedCount}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Empresa</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold truncate">{stats.client.company ?? stats.client.name}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Tickets Recentes</CardTitle>
        </CardHeader>
        <CardContent>
          {stats.recentTickets.length === 0 ? (
            <p className="text-muted-foreground text-sm">Nenhum ticket aberto.</p>
          ) : (
            <div className="space-y-3">
              {stats.recentTickets.map((ticket) => (
                <div key={ticket.id} className="flex items-center justify-between p-3 rounded-lg border">
                  <div>
                    <p className="font-medium text-sm">{ticket.subject}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {new Date(ticket.createdAt).toLocaleDateString("pt-BR")}
                    </p>
                  </div>
                  <Badge variant={ticket.status === "OPEN" ? "default" : "secondary"}>
                    {ticket.status === "OPEN" ? "Aberto" : ticket.status}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
      </PageContainer>
    </div>
  );
}
