import {
  Building2,
  CheckCircle,
  Users,
  DollarSign,
  Ticket,
  TrendingDown,
} from "lucide-react";
import { KpiCard } from "@/components/admin/kpi-card";
import type { DashboardMetrics } from "@/lib/actions/admin/dashboard";

interface KpiCardsProps {
  metrics: DashboardMetrics;
}

function formatMrr(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

export function KpiCards({ metrics }: KpiCardsProps) {
  const {
    totalAgencies,
    agenciesChange,
    activeAgencies,
    activePercentage,
    totalUsers,
    newUsersThisMonth,
    mrr,
    openTickets,
    churnRate,
  } = metrics;

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <KpiCard
        title="Total de Agências"
        value={totalAgencies}
        icon={Building2}
        description={
          agenciesChange >= 0
            ? `+${agenciesChange} vs mês anterior`
            : `${agenciesChange} vs mês anterior`
        }
        trend={agenciesChange > 0 ? "up" : agenciesChange < 0 ? "down" : "neutral"}
      />

      <KpiCard
        title="Agências Ativas"
        value={activeAgencies}
        icon={CheckCircle}
        description={`${activePercentage}% do total`}
        trend={activePercentage >= 70 ? "up" : activePercentage >= 40 ? "neutral" : "down"}
      />

      <KpiCard
        title="Usuários Totais"
        value={totalUsers}
        icon={Users}
        description={
          newUsersThisMonth > 0
            ? `+${newUsersThisMonth} novos este mês`
            : "Nenhum novo este mês"
        }
        trend={newUsersThisMonth > 0 ? "up" : "neutral"}
      />

      <KpiCard
        title="MRR"
        value={formatMrr(mrr)}
        icon={DollarSign}
        description="Receita recorrente mensal"
        trend={mrr > 0 ? "up" : "neutral"}
      />

      <KpiCard
        title="Tickets Abertos"
        value={openTickets}
        icon={Ticket}
        description={openTickets > 10 ? "Atenção: muitos tickets abertos" : "Dentro do normal"}
        trend={openTickets > 10 ? "down" : "neutral"}
      />

      <KpiCard
        title="Taxa de Churn"
        value={`${churnRate}%`}
        icon={TrendingDown}
        description="Cancelamentos nos últimos 30 dias"
        trend={churnRate > 5 ? "down" : churnRate > 0 ? "neutral" : "up"}
      />
    </div>
  );
}
