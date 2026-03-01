import type { Metadata } from "next";
import { Suspense } from "react";
import { KpiCards } from "@/components/admin/dashboard/kpi-cards";
import { GrowthChart } from "@/components/admin/dashboard/growth-chart";
import { RevenueByPlanChart } from "@/components/admin/dashboard/revenue-by-plan";
import { PlanDistributionChart } from "@/components/admin/dashboard/plan-distribution";
import { RecentActivity } from "@/components/admin/dashboard/recent-activity";
import {
  getDashboardMetrics,
  getGrowthData,
  getRevenueByPlan,
  getPlanDistribution,
  getRecentActivity,
} from "@/lib/actions/admin/dashboard";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { PageContainer } from "@/components/workspace/PageContainer";

export const metadata: Metadata = {
  title: "Dashboard",
};

async function DashboardContent() {
  const [metricsResult, growthResult, revenueResult, distResult, activityResult] =
    await Promise.all([
      getDashboardMetrics(),
      getGrowthData(12),
      getRevenueByPlan(),
      getPlanDistribution(),
      getRecentActivity(10),
    ]);

  const metrics = metricsResult.success ? metricsResult.data : null;
  const growth = growthResult.success ? growthResult.data : [];
  const revenue = revenueResult.success ? revenueResult.data : [];
  const distribution = distResult.success ? distResult.data : [];
  const activity = activityResult.success ? activityResult.data : [];

  return (
    <div className="space-y-6">
      {/* KPI Grid */}
      {metrics ? (
        <KpiCards metrics={metrics} />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-32 w-full rounded-lg" />
          ))}
        </div>
      )}

      {/* Charts row — growth (2/3) + pie (1/3) */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <GrowthChart data={growth} />
        <PlanDistributionChart data={distribution} />
      </div>

      {/* Revenue bar chart + recent activity */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <RevenueByPlanChart data={revenue} />
        <RecentActivity items={activity} />
      </div>
    </div>
  );
}

export default function AdminDashboardPage() {
  return (
    <PageContainer
      title="Dashboard"
      description="Visão geral da plataforma 360growth"
    >
      <Suspense
        fallback={
          <div className="space-y-6">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-32 w-full rounded-lg" />
              ))}
            </div>
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Card key={i} className={i === 0 ? "col-span-2" : ""}>
                  <CardHeader><Skeleton className="h-5 w-40" /></CardHeader>
                  <CardContent><Skeleton className="h-52 w-full" /></CardContent>
                </Card>
              ))}
            </div>
          </div>
        }
      >
        <DashboardContent />
      </Suspense>
    </PageContainer>
  );
}
