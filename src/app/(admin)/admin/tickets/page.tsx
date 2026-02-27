import type { Metadata } from "next";
import { getAdminTickets } from "@/lib/actions/admin/tickets";
import { DataTable } from "@/components/admin/data-table/data-table";
import { ticketColumns } from "./columns";
import { Badge } from "@/components/ui/badge";
import type { TicketStatus } from "@/lib/db/schema";

export const metadata: Metadata = { title: "Tickets de Suporte" };

const STATUS_LABELS: Record<TicketStatus, string> = {
  OPEN: "Abertos",
  IN_PROGRESS: "Em andamento",
  WAITING: "Aguardando",
  RESOLVED: "Resolvidos",
  CLOSED: "Fechados",
};

const STATUS_BADGE_VARIANTS: Record<
  TicketStatus,
  "default" | "secondary" | "outline" | "success" | "warning" | "destructive"
> = {
  OPEN: "default",
  IN_PROGRESS: "warning",
  WAITING: "secondary",
  RESOLVED: "success",
  CLOSED: "outline",
};

interface Props {
  searchParams: Promise<{
    page?: string;
    search?: string;
    status?: string;
    priority?: string;
    sortBy?: string;
    sortOrder?: string;
  }>;
}

export default async function AdminTicketsPage({ searchParams }: Props) {
  const params = await searchParams;
  const page = parseInt(params.page ?? "1", 10);

  const result = await getAdminTickets({
    page,
    perPage: 25,
    search: params.search,
    status: params.status,
    priority: params.priority,
    sortBy: params.sortBy,
    sortOrder: (params.sortOrder as "asc" | "desc") ?? "desc",
  });

  const { data: ticketsData = [], totalCount = 0, statusCounts = {} as Record<TicketStatus, number> } =
    result.success ? result.data : { data: [], totalCount: 0, statusCounts: {} as Record<TicketStatus, number> };

  const ACTIVE_STATUSES: TicketStatus[] = ["OPEN", "IN_PROGRESS", "WAITING"];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Tickets de Suporte</h1>
          <div className="mt-2 flex flex-wrap gap-2">
            {ACTIVE_STATUSES.map((s) => {
              const cnt = statusCounts[s] ?? 0;
              if (!cnt) return null;
              return (
                <Badge key={s} variant={STATUS_BADGE_VARIANTS[s]} className="text-xs">
                  {cnt} {STATUS_LABELS[s].toLowerCase()}
                </Badge>
              );
            })}
          </div>
        </div>
      </div>

      {/* DataTable */}
      <DataTable
        columns={ticketColumns}
        data={ticketsData}
        totalCount={totalCount}
        searchPlaceholder="Buscar por assunto..."
        facetedFilters={[
          {
            columnId: "status",
            title: "Status",
            options: [
              { label: "Aberto", value: "OPEN" },
              { label: "Em andamento", value: "IN_PROGRESS" },
              { label: "Aguardando", value: "WAITING" },
              { label: "Resolvido", value: "RESOLVED" },
              { label: "Fechado", value: "CLOSED" },
            ],
          },
          {
            columnId: "priority",
            title: "Prioridade",
            options: [
              { label: "Baixa", value: "LOW" },
              { label: "Média", value: "MEDIUM" },
              { label: "Alta", value: "HIGH" },
              { label: "Urgente", value: "URGENT" },
            ],
          },
        ]}
        emptyState={{
          title: "Nenhum ticket encontrado",
          description: "Os tickets das agências aparecerão aqui.",
        }}
      />
    </div>
  );
}
