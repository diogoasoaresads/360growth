import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { tickets } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Plus, TicketIcon } from "lucide-react";
import type { TicketStatus, TicketPriority } from "@/lib/db/schema";

export const metadata = {
  title: "Tickets | Agência",
};

const STATUS_CONFIG: Record<TicketStatus, { label: string; variant: "default" | "secondary" | "destructive" | "outline" | "success" | "warning" }> = {
  OPEN: { label: "Aberto", variant: "default" },
  IN_PROGRESS: { label: "Em Progresso", variant: "warning" },
  WAITING: { label: "Aguardando", variant: "secondary" },
  RESOLVED: { label: "Resolvido", variant: "success" },
  CLOSED: { label: "Fechado", variant: "outline" },
};

const PRIORITY_CONFIG: Record<TicketPriority, { label: string; variant: "default" | "secondary" | "destructive" | "outline" | "success" | "warning" }> = {
  LOW: { label: "Baixa", variant: "secondary" },
  MEDIUM: { label: "Média", variant: "default" },
  HIGH: { label: "Alta", variant: "warning" },
  URGENT: { label: "Urgente", variant: "destructive" },
};

async function getTickets(agencyId: string) {
  return db.query.tickets.findMany({
    where: eq(tickets.agencyId, agencyId),
    with: {
      client: true,
      assignedUser: true,
    },
    orderBy: [desc(tickets.createdAt)],
  });
}

export default async function AgencyTicketsPage() {
  const session = await auth();
  const agencyId = session?.user.agencyId;

  if (!agencyId) {
    return <div className="p-8"><p>Agência não configurada.</p></div>;
  }

  const ticketsList = await getTickets(agencyId);

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Tickets</h1>
          <p className="text-muted-foreground mt-1">
            Gerencie as solicitações dos seus clientes
          </p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Novo Ticket
        </Button>
      </div>

      {ticketsList.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16 space-y-4">
            <TicketIcon className="h-16 w-16 text-muted-foreground/40" />
            <div className="text-center">
              <h3 className="font-semibold">Nenhum ticket encontrado</h3>
              <p className="text-muted-foreground text-sm mt-1">
                Os tickets dos seus clientes aparecerão aqui
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {ticketsList.map((ticket) => {
            const status = STATUS_CONFIG[ticket.status];
            const priority = PRIORITY_CONFIG[ticket.priority];
            const ticketWithRelations = ticket as typeof ticket & { client?: { name?: string }; assignedUser?: { name?: string } };

            return (
              <Card key={ticket.id} className="hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="flex items-center justify-between p-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs text-muted-foreground font-mono">
                        #{ticket.id.slice(0, 8)}
                      </span>
                      <Badge variant={status.variant} className="text-xs">
                        {status.label}
                      </Badge>
                      <Badge variant={priority.variant} className="text-xs">
                        {priority.label}
                      </Badge>
                    </div>
                    <h3 className="font-medium truncate">{ticket.subject}</h3>
                    <p className="text-sm text-muted-foreground mt-0.5">
                      Cliente: {ticketWithRelations.client?.name ?? "N/A"}
                      {ticketWithRelations.assignedUser && (
                        <> · Responsável: {ticketWithRelations.assignedUser.name}</>
                      )}
                    </p>
                  </div>
                  <div className="text-xs text-muted-foreground ml-4 text-right flex-shrink-0">
                    {new Date(ticket.createdAt).toLocaleDateString("pt-BR")}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
