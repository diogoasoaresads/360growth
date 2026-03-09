"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Target,
    TrendingUp,
    Clock,
    BarChart,
} from "lucide-react";

interface ExecutiveMetricsProps {
    metrics: {
        totalValue: number;
        wonRevenue: number;
        totalDeals: number;
        wonDeals: number;
        conversionRate: number;
        avgCycleDays: number;
    };
}

export function ExecutiveMetrics({ metrics }: ExecutiveMetricsProps) {
    const kpis = [
        {
            title: "Pipeline Total",
            value: metrics.totalValue.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }),
            label: `${metrics.totalDeals} negócios ativos`,
            icon: BarChart,
            color: "text-blue-600",
            bg: "bg-blue-50"
        },
        {
            title: "Taxa de Conversão",
            value: `${metrics.conversionRate.toFixed(1)}%`,
            label: "Média de fechamento",
            icon: Target,
            color: "text-emerald-600",
            bg: "bg-emerald-50"
        },
        {
            title: "Receita Ganhos",
            value: metrics.wonRevenue.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }),
            label: `${metrics.wonDeals} deals fechados`,
            icon: TrendingUp,
            color: "text-indigo-600",
            bg: "bg-indigo-50"
        },
        {
            title: "Ciclo de Vendas",
            value: `${metrics.avgCycleDays} dias`,
            label: "Tempo médio de ganho",
            icon: Clock,
            color: "text-amber-600",
            bg: "bg-amber-50"
        }
    ];

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {kpis.map((kpi, i) => (
                <Card key={i} className="shadow-sm border-slate-200">
                    <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                        <CardTitle className="text-xs font-bold uppercase text-slate-500 tracking-wider">
                            {kpi.title}
                        </CardTitle>
                        <div className={`${kpi.bg} p-2 rounded-lg`}>
                            <kpi.icon className={`h-4 w-4 ${kpi.color}`} />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{kpi.value}</div>
                        <p className="text-[10px] text-muted-foreground mt-1 flex items-center gap-1">
                            {kpi.label}
                        </p>
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}
