import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { agencyUsers, clients, tickets, deals } from "@/lib/db/schema";
import { eq, count } from "drizzle-orm";
import { getAgencyById } from "@/lib/actions/admin/agencies";
import { KpiCard } from "@/components/admin/kpi-card";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Users, Building2, Ticket, TrendingUp, Globe, Phone, Mail, Calendar } from "lucide-react";
import { getAgencyUsage, getAgencyPlanLimits } from "@/lib/plan-limits";
import { UsagePanel } from "./usage-panel";

interface Props {
  params: Promise<{ agencyId: string }>;
}

export default async function AgencyOverviewPage({ params }: Props) {
  const { agencyId } = await params;
  const result = await getAgencyById(agencyId);
  if (!result.success) notFound();

  const agency = result.data;

  const [
    [{ membersCount }],
    [{ clientsCount }],
    [{ ticketsCount }],
    [{ dealsCount }],
    usage,
    limits,
  ] = await Promise.all([
    db.select({ membersCount: count() }).from(agencyUsers).where(eq(agencyUsers.agencyId, agencyId)),
    db.select({ clientsCount: count() }).from(clients).where(eq(clients.agencyId, agencyId)),
    db.select({ ticketsCount: count() }).from(tickets).where(eq(tickets.agencyId, agencyId)),
    db.select({ dealsCount: count() }).from(deals).where(eq(deals.agencyId, agencyId)),
    getAgencyUsage(agencyId),
    getAgencyPlanLimits(agencyId),
  ]);

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KpiCard
          title="Membros"
          value={membersCount}
          icon={Users}
          description={`de ${agency.maxMembers} máximo`}
        />
        <KpiCard
          title="Clientes"
          value={clientsCount}
          icon={Building2}
          description={`de ${agency.maxClients} máximo`}
        />
        <KpiCard
          title="Tickets"
          value={ticketsCount}
          icon={Ticket}
          description="total"
        />
        <KpiCard
          title="Negócios"
          value={dealsCount}
          icon={TrendingUp}
          description="no CRM"
        />
      </div>

      {/* Details */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Informações</CardTitle>
            <CardDescription>Dados cadastrais da agência.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              { icon: Mail, label: "Email", value: agency.email },
              { icon: Phone, label: "Telefone", value: agency.phone },
              { icon: Globe, label: "Website", value: agency.website },
              {
                icon: Calendar,
                label: "Criado em",
                value: format(new Date(agency.createdAt), "dd 'de' MMMM 'de' yyyy", { locale: ptBR }),
              },
              {
                icon: Calendar,
                label: "Trial até",
                value: agency.trialEndsAt
                  ? format(new Date(agency.trialEndsAt), "dd/MM/yyyy", { locale: ptBR })
                  : null,
              },
            ]
              .filter((item) => item.value)
              .map(({ icon: Icon, label, value }) => (
                <div key={label} className="flex items-center gap-3 text-sm">
                  <Icon className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <span className="text-muted-foreground w-20 flex-shrink-0">{label}</span>
                  <span className="font-medium">{value}</span>
                </div>
              ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Plano atual</CardTitle>
            <CardDescription>
              {agency.plan ? "Detalhes do plano contratado." : "Nenhum plano associado."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {agency.plan ? (
              <div className="space-y-2">
                <p className="text-xl font-bold">{agency.plan.name}</p>
                <div className="flex gap-4 text-sm text-muted-foreground">
                  <span>{agency.maxMembers} membros</span>
                  <span>{agency.maxClients} clientes</span>
                </div>
                {agency.stripeSubscriptionId && (
                  <p className="text-xs text-muted-foreground font-mono mt-2">
                    Sub: {agency.stripeSubscriptionId}
                  </p>
                )}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Esta agência não possui um plano associado.
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Usage Panel */}
      <UsagePanel usage={usage} limits={limits} />
    </div>
  );
}
