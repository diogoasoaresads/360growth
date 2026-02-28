import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getAgencyAuditLogs } from "@/lib/actions/admin/logs";
import { LogsClient } from "./logs-client";

interface LogsPageProps {
  params: Promise<{ agencyId: string }>;
  searchParams: Promise<{
    action?: string;
    period?: string;
    search?: string;
    page?: string;
  }>;
}

export const metadata = { title: "Logs da Agência | Admin" };

export default async function AgencyLogsPage({ params, searchParams }: LogsPageProps) {
  const session = await auth();
  if (!session || session.user.role !== "SUPER_ADMIN") {
    redirect("/admin");
  }

  const { agencyId } = await params;
  const { action, period, search, page: pageStr } = await searchParams;

  const page = Math.max(1, parseInt(pageStr ?? "1", 10) || 1);
  const currentAction = action ?? "";
  const currentPeriod = (period as "7d" | "30d" | "all") ?? "all";
  const currentSearch = search ?? "";

  const result = await getAgencyAuditLogs({
    agencyId,
    page,
    action: currentAction || undefined,
    period: currentPeriod,
    search: currentSearch || undefined,
  });

  const { items, totalCount, totalPages } = result.success
    ? result.data
    : { items: [], totalCount: 0, totalPages: 1 };

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold">Logs Operacionais</h2>
        <p className="text-sm text-muted-foreground">
          Timeline de eventos auditados para esta agência.
        </p>
      </div>

      {!result.success && (
        <p className="text-sm text-destructive rounded-md bg-destructive/10 px-3 py-2">
          {result.error}
        </p>
      )}

      <LogsClient
        agencyId={agencyId}
        items={items}
        totalCount={totalCount}
        page={page}
        totalPages={totalPages}
        currentAction={currentAction}
        currentPeriod={currentPeriod}
        currentSearch={currentSearch}
      />
    </div>
  );
}
