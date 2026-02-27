import Link from "next/link";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/admin/page-header";
import { AgenciesDataTable } from "@/components/admin/agencies/agencies-data-table";
import { getAgencies } from "@/lib/actions/admin/agencies";
import { Plus } from "lucide-react";

export const metadata = { title: "Agências — AgencyHub Admin" };

interface Props {
  searchParams: Promise<{
    page?: string;
    perPage?: string;
    search?: string;
  }>;
}

export default async function AgenciesPage({ searchParams }: Props) {
  const params = await searchParams;
  const page = Math.max(1, Number(params.page ?? 1));
  const perPage = [10, 25, 50].includes(Number(params.perPage ?? 25))
    ? Number(params.perPage ?? 25)
    : 25;
  const search = params.search ?? "";

  const result = await getAgencies({ page, perPage, search });

  const data = result.success ? result.data.agencies : [];
  const total = result.success ? result.data.total : 0;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Agências"
        description={`${total} agência${total !== 1 ? "s" : ""} cadastrada${total !== 1 ? "s" : ""}`}
      >
        <Button asChild>
          <Link href="/admin/agencies/new">
            <Plus className="h-4 w-4 mr-2" />
            Nova agência
          </Link>
        </Button>
      </PageHeader>

      {!result.success && (
        <p className="text-destructive text-sm">{result.error}</p>
      )}

      <AgenciesDataTable data={data} total={total} />
    </div>
  );
}
