import { getPlans } from "@/lib/actions/admin/plans";
import { PageHeader } from "@/components/admin/page-header";
import { PlanCard } from "@/components/admin/plans/plan-card";
import { EmptyState } from "@/components/admin/empty-state";
import { CreditCard } from "lucide-react";

export const metadata = { title: "Planos — AgencyHub Admin" };

export default async function PlansPage() {
  const result = await getPlans();

  if (!result.success) {
    return (
      <div>
        <PageHeader title="Planos" description="Gerencie os planos da plataforma" />
        <p className="text-destructive mt-4">{result.error}</p>
      </div>
    );
  }

  const plans = result.data;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Planos"
        description={`${plans.length} plano${plans.length !== 1 ? "s" : ""} cadastrado${plans.length !== 1 ? "s" : ""}`}
      />

      {plans.length === 0 ? (
        <EmptyState
          icon={CreditCard}
          title="Nenhum plano cadastrado"
          description="Adicione planos diretamente no banco de dados ou via seed."
        />
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {plans.map((plan) => (
            <PlanCard key={plan.id} plan={plan} />
          ))}
        </div>
      )}
    </div>
  );
}
