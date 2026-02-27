"use client";

import { ColumnDef } from "@tanstack/react-table";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { format } from "date-fns";
import Link from "next/link";
import { DataTableColumnHeader } from "@/components/admin/data-table/data-table-column-header";
import { StatusBadge } from "@/components/admin/status-badge";
import { RoleBadge } from "@/components/admin/role-badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { UserRowActions } from "@/components/admin/users/user-row-actions";
import type { UserWithAgency } from "@/lib/actions/admin/users";

export const userColumns: ColumnDef<UserWithAgency>[] = [
  {
    accessorKey: "name",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Usuário" />
    ),
    cell: ({ row }) => {
      const name = row.original.name ?? row.original.email;
      const initials = name
        .split(" ")
        .slice(0, 2)
        .map((w: string) => w[0])
        .join("")
        .toUpperCase();
      return (
        <div className="flex items-center gap-3">
          <Avatar className="h-8 w-8">
            <AvatarImage src={row.original.image ?? undefined} />
            <AvatarFallback className="text-xs bg-primary/10 text-primary">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="font-medium leading-none">{row.original.name ?? "—"}</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {row.original.email}
            </p>
          </div>
        </div>
      );
    },
    enableSorting: true,
  },
  {
    accessorKey: "role",
    header: "Função",
    cell: ({ row }) => <RoleBadge role={row.original.role} />,
    enableSorting: true,
  },
  {
    id: "agency",
    header: "Agência",
    cell: ({ row }) => {
      const { agency } = row.original;
      if (!agency) return <span className="text-muted-foreground text-sm">—</span>;
      return (
        <Link
          href={`/admin/agencies/${agency.id}`}
          className="text-sm font-medium hover:underline"
        >
          {agency.name}
          {agency.plan && (
            <span className="ml-1 text-xs text-muted-foreground">
              ({agency.plan.name})
            </span>
          )}
        </Link>
      );
    },
    enableSorting: false,
  },
  {
    accessorKey: "userStatus",
    header: "Status",
    cell: ({ row }) => (
      <StatusBadge status={row.original.userStatus ?? "active"} />
    ),
    enableSorting: false,
  },
  {
    accessorKey: "lastLoginAt",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Último acesso" />
    ),
    cell: ({ row }) => {
      const date = row.original.lastLoginAt;
      if (!date) return <span className="text-muted-foreground text-sm">Nunca</span>;
      return (
        <span className="text-sm text-muted-foreground">
          {formatDistanceToNow(new Date(date), { locale: ptBR, addSuffix: true })}
        </span>
      );
    },
    enableSorting: true,
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
    cell: ({ row }) => <UserRowActions user={row.original} />,
    enableSorting: false,
    size: 60,
  },
];
