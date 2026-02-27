import { db } from "@/lib/db";
import { clients } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/admin/empty-state";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Building2 } from "lucide-react";

interface Props {
  params: Promise<{ agencyId: string }>;
}

export default async function AgencyClientsPage({ params }: Props) {
  const { agencyId } = await params;
  const session = await auth();
  if (!session || session.user.role !== "SUPER_ADMIN") redirect("/unauthorized");

  const agencyClients = await db
    .select()
    .from(clients)
    .where(eq(clients.agencyId, agencyId))
    .orderBy(desc(clients.createdAt))
    .limit(50);

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        {agencyClients.length} cliente{agencyClients.length !== 1 ? "s" : ""}{" "}
        (mostrando até 50)
      </p>

      {agencyClients.length === 0 ? (
        <EmptyState
          icon={Building2}
          title="Nenhum cliente"
          description="Esta agência não possui clientes cadastrados."
        />
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Empresa</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Cadastrado em</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {agencyClients.map((client) => (
                <TableRow key={client.id}>
                  <TableCell className="font-medium">{client.name}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {client.email}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {client.company ?? "—"}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={client.status === "active" ? "default" : "secondary"}
                    >
                      {client.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {format(new Date(client.createdAt), "dd/MM/yyyy", {
                      locale: ptBR,
                    })}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
