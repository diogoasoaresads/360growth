"use client";

import { DataTable } from "@/components/admin/data-table/data-table";
import { userColumns } from "@/app/(admin)/admin/users/columns";
import type { UserWithAgency } from "@/lib/actions/admin/users";

interface UsersDataTableProps {
  data: UserWithAgency[];
  total: number;
}

const ROLE_OPTIONS = [
  { label: "Super Admin", value: "SUPER_ADMIN" },
  { label: "Admin da Agência", value: "AGENCY_ADMIN" },
  { label: "Membro", value: "AGENCY_MEMBER" },
  { label: "Cliente", value: "CLIENT" },
];

const STATUS_OPTIONS = [
  { label: "Ativo", value: "active" },
  { label: "Suspenso", value: "suspended" },
  { label: "Inativo", value: "inactive" },
];

export function UsersDataTable({ data, total }: UsersDataTableProps) {
  return (
    <DataTable
      columns={userColumns}
      data={data}
      totalCount={total}
      searchPlaceholder="Buscar por nome ou email..."
      facetedFilters={[
        {
          columnId: "role",
          title: "Função",
          options: ROLE_OPTIONS,
        },
        {
          columnId: "userStatus",
          title: "Status",
          options: STATUS_OPTIONS,
        },
      ]}
    />
  );
}
