"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { RevenueByPlan } from "@/lib/actions/admin/dashboard";

const PLAN_COLORS: Record<string, string> = {
  starter: "#94a3b8",
  growth: "#3b82f6",
  pro: "#8b5cf6",
  enterprise: "#f59e0b",
};

function getPlanColor(planName: string): string {
  return PLAN_COLORS[planName.toLowerCase()] ?? "#6366f1";
}

function formatBrl(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

interface RevenueByPlanChartProps {
  data: RevenueByPlan[];
}

export function RevenueByPlanChart({ data }: RevenueByPlanChartProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base font-semibold">Receita por Plano</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis
              dataKey="plan"
              tick={{ fontSize: 12 }}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              tick={{ fontSize: 12 }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v) => `R$${v}`}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--popover))",
                borderColor: "hsl(var(--border))",
                borderRadius: "8px",
                fontSize: 12,
              }}
              formatter={(value: number | undefined) => [formatBrl(value ?? 0), "Receita"]}
            />
            <Bar dataKey="revenue" radius={[4, 4, 0, 0]}>
              {data.map((entry) => (
                <Cell key={entry.plan} fill={getPlanColor(entry.plan)} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
