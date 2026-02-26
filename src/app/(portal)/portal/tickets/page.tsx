import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { tickets, clients } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Plus, TicketIcon } from "lucide-react";
import type { TicketStatus, TicketPriority } from "@/lib/db/schema";

export const metadata = {
  title: "Meus Tickets | Portal",
};

const STATUS_LABELS: Record<TicketStatus, string> = {
  OPEN: "Aberto",
  IN_PROGRESS: "Em Progresso",
  WAITING: "Aguardando",
  RESOLVED: "Resolvido",
  CLOSED: "Fechado",
};

const PRIORITY_LABELS: Record<TicketPriority, string> = {
  LOW: "Baixa",
  MEDIUM: "Média",
  HIGH: "Alta",
  URGENT: "Urgente",
};

export default async function PortalTicketsPage() {
  const session = await auth();

  const client = await db.query.clients.findFirst({
    where: eq(clients.userId, session!.user.id),
  });

  if (!client) {
    return (
      <div className="p-8">
        <p className="text-muted-foreground">Perfil de cliente não configurado.</p>
      </div>
    );
  }

  const ticketsList = await db.query.tickets.findMany({
    where: eq(tickets.clientId, client.id),
    orderBy: [desc(tickets.createdAt)],
  });

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Meus Tickets</h1>
          <p className="text-muted-foreground mt-1">
            Acompanhe suas solicitações
          </p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Abrir Ticket
        </Button>
      </div>

      {ticketsList.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16 space-y-4">
            <TicketIcon className="h-16 w-16 text-muted-foreground/40" />
            <div className="text-center">
              <h3 className="font-semibold">Nenhum ticket encontrado</h3>
              <p className="text-muted-foreground text-sm mt-1">
                Abra um ticket para solicitar suporte
              </p>
            </div>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Abrir Primeiro Ticket
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {ticketsList.map((ticket) => (
            <Card key={ticket.id} className="hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="flex items-center justify-between p-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs text-muted-foreground font-mono">
                      #{ticket.id.slice(0, 8)}
                    </span>
                    <Badge variant={ticket.status === "OPEN" ? "default" : "secondary"}>
                      {STATUS_LABELS[ticket.status]}
                    </Badge>
                    <Badge variant="outline">
                      {PRIORITY_LABELS[ticket.priority]}
                    </Badge>
                  </div>
                  <h3 className="font-medium truncate">{ticket.subject}</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Aberto em {new Date(ticket.createdAt).toLocaleDateString("pt-BR")}
                  </p>
                </div>
                {ticket.resolvedAt && (
                  <div className="text-xs text-muted-foreground ml-4 text-right">
                    Resolvido em {new Date(ticket.resolvedAt).toLocaleDateString("pt-BR")}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
