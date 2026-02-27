import type { Metadata } from "next";
import Link from "next/link";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  DollarSign,
  TrendingUp,
  CreditCard,
  Receipt,
  TrendingDown,
  Target,
  ExternalLink,
} from "lucide-react";
import { getBillingMetrics, getRecentTransactions, getMonthlyRevenue } from "@/lib/actions/admin/billing";
import { KpiCard } from "@/components/admin/kpi-card";
import { MonthlyRevenueChart } from "@/components/admin/billing/monthly-revenue-chart";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export const metadata: Metadata = {
  title: "Faturamento — 360growth Admin",
};

function formatBrl(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 0,
  }).format(value);
}

const TRANSACTION_TYPE_CONFIG = {
  payment: { label: "Pagamento", variant: "default" as const, className: "bg-green-100 text-green-800" },
  refund: { label: "Reembolso", variant: "secondary" as const, className: "bg-yellow-100 text-yellow-800" },
  failure: { label: "Falha", variant: "destructive" as const, className: "" },
};

const TRANSACTION_STATUS_CONFIG = {
  success: { label: "Sucesso", className: "bg-green-100 text-green-800" },
  pending: { label: "Pendente", className: "bg-yellow-100 text-yellow-800" },
  failed: { label: "Falhou", className: "bg-red-100 text-red-800" },
};

export default async function BillingPage() {
  const [metricsResult, transactionsResult, revenueResult] = await Promise.all([
    getBillingMetrics(),
    getRecentTransactions(20),
    getMonthlyRevenue(6),
  ]);

  const metrics = metricsResult.success ? metricsResult.data : null;
  const transactions = transactionsResult.success ? transactionsResult.data : [];
  const monthlyRevenue = revenueResult.success ? revenueResult.data : [];

  return (
    <div className="flex-1 space-y-6 p-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Faturamento</h1>
        <p className="text-sm text-muted-foreground">
          Visão geral de receita e transações da plataforma.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <KpiCard
          title="MRR Atual"
          value={metrics ? formatBrl(metrics.mrr) : "—"}
          description="Receita mensal recorrente"
          icon={DollarSign}
          trend="neutral"
        />
        <KpiCard
          title="ARR"
          value={metrics ? formatBrl(metrics.arr) : "—"}
          description="Receita anual recorrente (MRR × 12)"
          icon={TrendingUp}
          trend="up"
        />
        <KpiCard
          title="Agências Pagantes"
          value={metrics?.payingAgencies ?? "—"}
          description="Com assinatura ativa"
          icon={CreditCard}
          trend="neutral"
        />
        <KpiCard
          title="Ticket Médio"
          value={metrics ? formatBrl(metrics.averageTicket) : "—"}
          description="MRR / agências pagantes"
          icon={Receipt}
          trend="neutral"
        />
        <KpiCard
          title="Taxa de Churn"
          value={metrics ? `${metrics.churnRate.toFixed(1)}%` : "—"}
          description="Cancelamentos / total de agências"
          icon={TrendingDown}
          trend={metrics && metrics.churnRate > 5 ? "down" : "neutral"}
        />
        <KpiCard
          title="LTV Médio"
          value={metrics ? formatBrl(metrics.ltv) : "—"}
          description="Ticket médio / churn rate mensal"
          icon={Target}
          trend="up"
        />
      </div>

      {/* Monthly Revenue Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Receita Mensal</CardTitle>
          <CardDescription>Novas assinaturas ativas nos últimos 6 meses</CardDescription>
        </CardHeader>
        <CardContent>
          {monthlyRevenue.length > 0 ? (
            <MonthlyRevenueChart data={monthlyRevenue} />
          ) : (
            <div className="flex h-[220px] items-center justify-center text-sm text-muted-foreground">
              Sem dados de receita
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Transactions */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Transações Recentes</CardTitle>
            <CardDescription>Últimas assinaturas ativas da plataforma</CardDescription>
          </div>
          <Link
            href="https://dashboard.stripe.com"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-sm text-primary hover:underline"
          >
            Abrir Stripe Dashboard
            <ExternalLink className="h-3 w-3" />
          </Link>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Agência</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead className="text-right">Valor</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                    Nenhuma transação encontrada.
                  </TableCell>
                </TableRow>
              ) : (
                transactions.map((txn) => {
                  const typeConfig = TRANSACTION_TYPE_CONFIG[txn.type];
                  const statusConfig = TRANSACTION_STATUS_CONFIG[txn.status];
                  return (
                    <TableRow key={txn.id}>
                      <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                        {format(txn.date, "dd/MM/yyyy HH:mm", { locale: ptBR })}
                      </TableCell>
                      <TableCell>
                        <Link
                          href={`/admin/agencies/${txn.agencyId}`}
                          className="font-medium hover:underline"
                        >
                          {txn.agencyName}
                        </Link>
                      </TableCell>
                      <TableCell>
                        <Badge className={typeConfig.className}>
                          {typeConfig.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm">{txn.description}</TableCell>
                      <TableCell className="text-right font-mono text-sm">
                        {formatBrl(txn.amount)}
                      </TableCell>
                      <TableCell>
                        <Badge className={statusConfig.className}>
                          {statusConfig.label}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
