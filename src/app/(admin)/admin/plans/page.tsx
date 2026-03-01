import { getPlans } from "@/lib/actions/admin/plans";
import { PlanCard } from "@/components/admin/plans/plan-card";
import { EmptyState } from "@/components/admin/empty-state";
import { CreditCard } from "lucide-react";
import { PageContainer } from "@/components/workspace/PageContainer";

export const metadata = { title: "Planos — 360growth Admin" };

export default async function PlansPage() {
  const result = await getPlans();

  if (!result.success) {
    return (
      <PageContainer title="Planos" description="Gerencie os planos da plataforma">
        <p className="text-destructive">{result.error}</p>
      </PageContainer>
    );
  }

  const plans = result.data;

  return (
    <PageContainer
      title="Planos"
      description={`${plans.length} plano${plans.length !== 1 ? "s" : ""} cadastrado${plans.length !== 1 ? "s" : ""}`}
    >
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
    </PageContainer>
  );
}
