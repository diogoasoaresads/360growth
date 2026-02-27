import type { Metadata } from "next";
import { Suspense } from "react";
import { getAuditLogs } from "@/lib/actions/admin/logs";
import { ACTION_CATEGORIES } from "@/lib/log-utils";
import { LogsTable } from "./logs-table";
import { LogsToolbar } from "./logs-toolbar";

export const metadata: Metadata = {
  title: "Logs de Auditoria — 360growth Admin",
};

interface Props {
  searchParams: Promise<{
    page?: string;
    perPage?: string;
    search?: string;
    categories?: string;
    entityType?: string;
    agencyId?: string;
    actorUserId?: string;
    dateFrom?: string;
    dateTo?: string;
    order?: string;
  }>;
}

export default async function LogsPage({ searchParams }: Props) {
  const params = await searchParams;

  const page = Math.max(1, Number(params.page ?? 1));
  const perPage = [10, 25, 50].includes(Number(params.perPage ?? 25))
    ? Number(params.perPage ?? 25)
    : 25;
  const search = params.search ?? "";
  const entityType = params.entityType ?? "";
  const agencyId = params.agencyId ?? "";
  const actorUserId = params.actorUserId ?? "";
  const dateFrom = params.dateFrom ?? "";
  const dateTo = params.dateTo ?? "";
  const sortOrder = params.order === "asc" ? "asc" : "desc";

  // Parse selected categories → list of action strings
  const selectedCategories = params.categories
    ? params.categories.split(",").filter((c) => c in ACTION_CATEGORIES)
    : [];

  const actions =
    selectedCategories.length > 0
      ? selectedCategories.flatMap(
          (cat) => ACTION_CATEGORIES[cat as keyof typeof ACTION_CATEGORIES].actions as unknown as string[]
        )
      : undefined;

  const result = await getAuditLogs({
    page,
    perPage,
    search,
    actions,
    entityType: entityType || undefined,
    agencyId: agencyId || undefined,
    actorUserId: actorUserId || undefined,
    dateFrom,
    dateTo,
    sortOrder,
  });

  const data = result.success ? result.data.data : [];
  const totalCount = result.success ? result.data.totalCount : 0;
  const totalPages = result.success ? result.data.totalPages : 0;

  return (
    <div className="flex-1 space-y-6 p-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Logs de Auditoria</h1>
        <p className="text-sm text-muted-foreground">
          Histórico de todas as ações realizadas na plataforma.
          {totalCount > 0 && (
            <span className="ml-1 font-medium">{totalCount.toLocaleString("pt-BR")} registros.</span>
          )}
        </p>
      </div>

      {/* Toolbar (client) */}
      <Suspense fallback={null}>
        <LogsToolbar
          search={search}
          selectedCategories={selectedCategories}
          entityType={entityType}
          agencyId={agencyId}
          actorUserId={actorUserId}
          dateFrom={dateFrom}
          dateTo={dateTo}
        />
      </Suspense>

      {/* Table */}
      <LogsTable
        data={data}
        totalCount={totalCount}
        page={page}
        perPage={perPage}
        totalPages={totalPages}
        sortOrder={sortOrder}
      />
    </div>
  );
}
