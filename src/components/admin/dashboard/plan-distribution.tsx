"use client";

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { PlanDistribution } from "@/lib/actions/admin/dashboard";

const PLAN_COLORS: Record<string, string> = {
  starter: "#94a3b8",
  growth: "#3b82f6",
  pro: "#8b5cf6",
  enterprise: "#f59e0b",
};

function getPlanColor(planName: string, index: number): string {
  const fallbacks = ["#6366f1", "#ec4899", "#14b8a6", "#f97316"];
  return PLAN_COLORS[planName.toLowerCase()] ?? fallbacks[index % fallbacks.length];
}

interface PlanDistributionChartProps {
  data: PlanDistribution[];
}

export function PlanDistributionChart({ data }: PlanDistributionChartProps) {
  const hasData = data.some((d) => d.count > 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base font-semibold">Distribuição por Plano</CardTitle>
      </CardHeader>
      <CardContent>
        {!hasData ? (
          <div className="flex h-[200px] items-center justify-center text-sm text-muted-foreground">
            Nenhuma agência cadastrada
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={data}
                dataKey="count"
                nameKey="plan"
                cx="50%"
                cy="45%"
                innerRadius={45}
                outerRadius={75}
                paddingAngle={2}
              >
                {data.map((entry, index) => (
                  <Cell key={entry.plan} fill={getPlanColor(entry.plan, index)} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--popover))",
                  borderColor: "hsl(var(--border))",
                  borderRadius: "8px",
                  fontSize: 12,
                }}
                formatter={(value: number | undefined, name?: string) => {
                  const v = value ?? 0;
                  return [`${v} agência${v !== 1 ? "s" : ""}`, name ?? ""];
                }}
              />
              <Legend
                iconType="circle"
                iconSize={8}
                formatter={(value) => {
                  const item = data.find((d) => d.plan === value);
                  return `${value} (${item?.percentage ?? 0}%)`;
                }}
                wrapperStyle={{ fontSize: 11 }}
              />
            </PieChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
