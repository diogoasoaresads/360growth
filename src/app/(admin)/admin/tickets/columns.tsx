"use client";

import type { ColumnDef } from "@tanstack/react-table";
import Link from "next/link";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { formatDistanceToNow } from "date-fns";
import { ArrowUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { TicketWithAgency } from "@/lib/actions/admin/tickets";
import type { TicketStatus, TicketPriority } from "@/lib/db/schema";

// ─────────────────────────────────────────────────────────
// CONFIG MAPS
// ─────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<
  TicketStatus,
  { label: string; variant: "default" | "secondary" | "destructive" | "outline" | "success" | "warning" }
> = {
  OPEN:        { label: "Aberto",       variant: "default" },
  IN_PROGRESS: { label: "Em andamento", variant: "warning" },
  WAITING:     { label: "Aguardando",   variant: "secondary" },
  RESOLVED:    { label: "Resolvido",    variant: "success" },
  CLOSED:      { label: "Fechado",      variant: "outline" },
};

const PRIORITY_CONFIG: Record<
  TicketPriority,
  { label: string; variant: "default" | "secondary" | "destructive" | "outline" | "success" | "warning" }
> = {
  LOW:    { label: "Baixa",   variant: "secondary" },
  MEDIUM: { label: "Média",   variant: "default" },
  HIGH:   { label: "Alta",    variant: "warning" },
  URGENT: { label: "Urgente", variant: "destructive" },
};

// ─────────────────────────────────────────────────────────
// COLUMN DEFINITIONS
// ─────────────────────────────────────────────────────────

export const ticketColumns: ColumnDef<TicketWithAgency>[] = [
  {
    accessorKey: "id",
    header: "ID",
    cell: ({ row }) => (
      <Link
        href={`/admin/tickets/${row.original.id}`}
        className="font-mono text-xs text-muted-foreground hover:text-primary"
      >
        #{row.original.id.slice(0, 6).toUpperCase()}
      </Link>
    ),
    size: 80,
  },
  {
    accessorKey: "subject",
    header: ({ column }) => (
      <Button
        variant="ghost"
        size="sm"
        className="-ml-3 h-8"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Assunto
        <ArrowUpDown className="ml-2 h-3.5 w-3.5" />
      </Button>
    ),
    cell: ({ row }) => (
      <Link
        href={`/admin/tickets/${row.original.id}`}
        className="font-medium hover:text-primary line-clamp-1 max-w-[300px] block"
      >
        {row.original.subject}
      </Link>
    ),
  },
  {
    id: "agency",
    header: "Agência",
    accessorFn: (row) => row.agency?.name ?? "",
    cell: ({ row }) => {
      const agency = row.original.agency;
      if (!agency) return <span className="text-muted-foreground text-sm">—</span>;
      return (
        <Link
          href={`/admin/agencies/${agency.id}`}
          className="text-sm hover:text-primary hover:underline"
        >
          {agency.name}
        </Link>
      );
    },
  },
  {
    accessorKey: "priority",
    header: "Prioridade",
    cell: ({ row }) => {
      const cfg = PRIORITY_CONFIG[row.original.priority];
      return <Badge variant={cfg.variant}>{cfg.label}</Badge>;
    },
    filterFn: (row, id, value: string[]) => value.includes(row.getValue(id)),
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const cfg = STATUS_CONFIG[row.original.status];
      return <Badge variant={cfg.variant}>{cfg.label}</Badge>;
    },
    filterFn: (row, id, value: string[]) => value.includes(row.getValue(id)),
  },
  {
    accessorKey: "createdAt",
    header: ({ column }) => (
      <Button
        variant="ghost"
        size="sm"
        className="-ml-3 h-8"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Criado em
        <ArrowUpDown className="ml-2 h-3.5 w-3.5" />
      </Button>
    ),
    cell: ({ row }) => (
      <span className="text-sm text-muted-foreground whitespace-nowrap">
        {format(new Date(row.original.createdAt), "dd/MM/yyyy HH:mm", { locale: ptBR })}
      </span>
    ),
  },
  {
    accessorKey: "updatedAt",
    header: "Última resposta",
    cell: ({ row }) => (
      <span className="text-sm text-muted-foreground whitespace-nowrap">
        {formatDistanceToNow(new Date(row.original.updatedAt), {
          addSuffix: true,
          locale: ptBR,
        })}
      </span>
    ),
  },
];
