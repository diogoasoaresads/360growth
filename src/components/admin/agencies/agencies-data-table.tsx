"use client";

import { DataTable } from "@/components/admin/data-table/data-table";
import { agencyColumns } from "@/app/(admin)/admin/agencies/columns";
import type { AgencyListItem } from "@/lib/actions/admin/agencies";

interface AgenciesDataTableProps {
  data: AgencyListItem[];
  total: number;
}

const STATUS_OPTIONS = [
  { label: "Ativo", value: "active" },
  { label: "Trial", value: "trial" },
  { label: "Suspenso", value: "suspended" },
  { label: "Cancelado", value: "cancelled" },
];

export function AgenciesDataTable({ data, total }: AgenciesDataTableProps) {
  return (
    <DataTable
      columns={agencyColumns}
      data={data}
      totalCount={total}
      searchPlaceholder="Buscar por nome..."
      facetedFilters={[
        {
          columnId: "agencyStatus",
          title: "Status",
          options: STATUS_OPTIONS,
        },
      ]}
    />
  );
}
