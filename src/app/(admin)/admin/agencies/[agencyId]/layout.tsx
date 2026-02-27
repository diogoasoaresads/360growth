import { notFound } from "next/navigation";
import Link from "next/link";
import { getAgencyById } from "@/lib/actions/admin/agencies";
import { AgencyTabs } from "@/components/admin/agencies/agency-tabs";
import { StatusBadge } from "@/components/admin/status-badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

interface Props {
  children: React.ReactNode;
  params: Promise<{ agencyId: string }>;
}

export async function generateMetadata({ params }: { params: Promise<{ agencyId: string }> }) {
  const { agencyId } = await params;
  const result = await getAgencyById(agencyId);
  if (!result.success) return { title: "Agência — 360growth Admin" };
  return { title: `${result.data.name} — 360growth Admin` };
}

export default async function AgencyDetailLayout({ children, params }: Props) {
  const { agencyId } = await params;
  const result = await getAgencyById(agencyId);

  if (!result.success) notFound();

  const agency = result.data;

  return (
    <div className="space-y-6">
      {/* Back button + header */}
      <div className="flex items-center gap-4">
        <Button asChild variant="ghost" size="sm">
          <Link href="/admin/agencies">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Agências
          </Link>
        </Button>
      </div>

      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight">{agency.name}</h1>
            <StatusBadge status={agency.agencyStatus ?? "trial"} />
          </div>
          <p className="text-sm text-muted-foreground mt-1 font-mono">
            {agency.slug}
            {agency.email && ` · ${agency.email}`}
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>Plano: {agency.plan?.name ?? "—"}</span>
        </div>
      </div>

      {/* Tabs */}
      <AgencyTabs agencyId={agencyId} />

      {/* Tab content */}
      {children}
    </div>
  );
}
