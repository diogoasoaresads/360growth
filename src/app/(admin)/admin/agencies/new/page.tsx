import { getPlans } from "@/lib/actions/admin/plans";
import { PageHeader } from "@/components/admin/page-header";
import { CreateAgencyForm } from "@/components/admin/agencies/create-agency-form";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const metadata = { title: "Nova Agência — 360growth Admin" };

export default async function NewAgencyPage() {
  const plansResult = await getPlans();
  const plans = plansResult.success ? plansResult.data.filter((p) => p.isActive) : [];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button asChild variant="ghost" size="sm">
          <Link href="/admin/agencies">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Agências
          </Link>
        </Button>
      </div>
      <PageHeader
        title="Nova agência"
        description="Preencha os dados para cadastrar uma nova agência na plataforma."
      />
      <CreateAgencyForm plans={plans} />
    </div>
  );
}
