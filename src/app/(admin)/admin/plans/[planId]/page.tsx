import { notFound } from "next/navigation";
import { getPlanById } from "@/lib/actions/admin/plans";
import { PageHeader } from "@/components/admin/page-header";
import { PlanEditForm } from "@/components/admin/plans/plan-edit-form";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const metadata = { title: "Editar Plano — 360growth Admin" };

interface Props {
  params: Promise<{ planId: string }>;
}

export default async function PlanEditPage({ params }: Props) {
  const { planId } = await params;
  const result = await getPlanById(planId);

  if (!result.success) notFound();

  const plan = result.data;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button asChild variant="ghost" size="sm">
          <Link href="/admin/plans">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Planos
          </Link>
        </Button>
      </div>
      <PageHeader
        title={`Editar: ${plan.name}`}
        description="Atualize as configurações deste plano."
      />
      <PlanEditForm plan={plan} />
    </div>
  );
}
