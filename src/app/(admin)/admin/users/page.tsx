import { UsersDataTable } from "@/components/admin/users/users-data-table";
import { getUsers } from "@/lib/actions/admin/users";
import { PageContainer } from "@/components/workspace/PageContainer";

export const metadata = { title: "Usuários — 360growth Admin" };

interface Props {
  searchParams: Promise<{
    page?: string;
    perPage?: string;
    search?: string;
    role?: string;
  }>;
}

export default async function UsersPage({ searchParams }: Props) {
  const params = await searchParams;
  const page = Math.max(1, Number(params.page ?? 1));
  const perPage = [10, 25, 50].includes(Number(params.perPage ?? 25))
    ? Number(params.perPage ?? 25)
    : 25;

  const result = await getUsers({
    page,
    perPage,
    search: params.search ?? "",
    role: params.role ?? "",
  });

  const data = result.success ? result.data.users : [];
  const total = result.success ? result.data.total : 0;

  return (
    <PageContainer
      title="Usuários"
      description={`${total} usuário${total !== 1 ? "s" : ""} na plataforma`}
    >
      {!result.success && (
        <p className="text-destructive text-sm">{result.error}</p>
      )}

      <UsersDataTable data={data} total={total} />
    </PageContainer>
  );
}
