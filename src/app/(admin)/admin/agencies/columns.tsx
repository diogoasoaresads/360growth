"use client";

import { ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { DataTableColumnHeader } from "@/components/admin/data-table/data-table-column-header";
import { StatusBadge } from "@/components/admin/status-badge";
import { AgencyRowActions } from "@/components/admin/agencies/agency-row-actions";
import type { AgencyListItem } from "@/lib/actions/admin/agencies";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export const agencyColumns: ColumnDef<AgencyListItem>[] = [
  {
    accessorKey: "name",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Agência" />
    ),
    cell: ({ row }) => {
      const initials = row.original.name
        .split(" ")
        .slice(0, 2)
        .map((w) => w[0])
        .join("")
        .toUpperCase();
      return (
        <div className="flex items-center gap-3">
          <Avatar className="h-8 w-8">
            <AvatarFallback className="text-xs bg-primary/10 text-primary">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="font-medium leading-none">{row.original.name}</p>
            <p className="text-xs text-muted-foreground mt-0.5 font-mono">
              {row.original.slug}
            </p>
          </div>
        </div>
      );
    },
    enableSorting: true,
  },
  {
    accessorKey: "agencyStatus",
    header: "Status",
    cell: ({ row }) => (
      <StatusBadge status={row.original.agencyStatus ?? "trial"} />
    ),
    enableSorting: false,
  },
  {
    id: "plan",
    header: "Plano",
    cell: ({ row }) =>
      row.original.plan?.name ?? (
        <span className="text-muted-foreground text-sm">—</span>
      ),
    enableSorting: false,
  },
  {
    id: "membersCount",
    header: "Membros",
    cell: ({ row }) => (
      <span className="text-sm">{row.original.membersCount}</span>
    ),
    enableSorting: false,
  },
  {
    id: "clientsCount",
    header: "Clientes",
    cell: ({ row }) => (
      <span className="text-sm">{row.original.clientsCount}</span>
    ),
    enableSorting: false,
  },
  {
    accessorKey: "createdAt",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Criado em" />
    ),
    cell: ({ row }) =>
      format(new Date(row.original.createdAt), "dd/MM/yyyy", { locale: ptBR }),
    enableSorting: true,
  },
  {
    id: "actions",
    cell: ({ row }) => <AgencyRowActions agency={row.original} />,
    enableSorting: false,
    size: 60,
  },
];
