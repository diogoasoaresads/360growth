import { Suspense } from "react";
import { getRevenueByChannel, getExecutiveMetrics, getSellerRanking } from "@/lib/actions/crm-reports.actions";
import { RevenueByChannel } from "@/components/crm/RevenueByChannel";
import { ExecutiveMetrics } from "@/components/crm/ExecutiveMetrics";
import { SellerRanking } from "@/components/crm/SellerRanking";
import { Separator } from "@/components/ui/separator";
import { BarChart3, Filter, Lightbulb, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getGlobalInsights } from "@/lib/crm/crm-intelligence";

export const metadata = {
    title: "Analytics CRM | 360growth",
    description: "Inteligência comercial e performance de vendas",
};

export default async function CRMAnalyticsPage() {
    // Initial data fetch
    const [channelData, executiveMetrics, ranking] = await Promise.all([
        getRevenueByChannel(),
        getExecutiveMetrics(),
        getSellerRanking()
    ]);

    const globalInsights = getGlobalInsights(executiveMetrics, channelData);

    return (
        <div className="flex-1 space-y-8 p-8 pt-6 bg-slate-50/30 min-h-screen">
            <div className="flex items-center justify-between space-y-2">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-slate-900">Analytics CRM</h2>
                    <p className="text-muted-foreground">
                        Inteligência comercial e análise de performance por canal e vendedor.
                    </p>
                </div>
                <div className="flex items-center space-x-2">
                    <Button variant="outline" size="sm" className="h-9 border-slate-200">
                        <Filter className="mr-2 h-4 w-4" />
                        Filtros Avançados
                    </Button>
                    <Button size="sm" className="h-9">
                        Exportar Relatório
                    </Button>
                </div>
            </div>

            <Separator className="bg-slate-200" />

            <div className="space-y-8">
                {/* 1. Key Metrics Overview */}
                <Suspense fallback={<div className="h-32 w-full animate-pulse bg-slate-100 rounded-xl" />}>
                    <ExecutiveMetrics metrics={executiveMetrics} />
                </Suspense>

                {/* Automation & Insights Alert Section (Phase 3 Engine) */}
                {globalInsights.length > 0 && (
                    <div className="bg-amber-50 border border-amber-100 rounded-2xl p-6">
                        <div className="flex items-center gap-3 mb-4">
                            <Lightbulb className="h-6 w-6 text-amber-500" />
                            <h3 className="text-lg font-bold text-amber-900">Insights Automáticos da IA</h3>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {globalInsights.map((insight, i) => (
                                <div key={i} className="flex gap-2 text-sm text-amber-800 bg-white/50 p-3 rounded-xl border border-amber-200/50">
                                    <AlertCircle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                                    <span>{insight}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* 2. Revenue By Channel Table (Marketing Focus) */}
                    <div className="lg:col-span-2">
                        <Suspense fallback={<div className="h-[400px] w-full animate-pulse bg-slate-100 rounded-xl" />}>
                            <RevenueByChannel data={channelData} />
                        </Suspense>
                    </div>

                    {/* 3. Seller Ranking (Sales Focus) */}
                    <div className="lg:col-span-1">
                        <Suspense fallback={<div className="h-[400px] w-full animate-pulse bg-slate-100 rounded-xl" />}>
                            <SellerRanking ranking={ranking} />
                        </Suspense>
                    </div>
                </div>

                {/* Automation & Insights Alert Section (Phase 3 Engine) */}
                <div className="bg-primary/5 border border-primary/10 rounded-2xl p-6 flex flex-col md:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                            <BarChart3 className="h-6 w-6" />
                        </div>
                        <div>
                            <h4 className="font-bold text-slate-900">Configurar Automações Inteligentes</h4>
                            <p className="text-sm text-slate-600 max-w-md">
                                Use os dados de performance acima para criar regras de follow-up automático ou alertas de SLA para sua equipe.
                            </p>
                        </div>
                    </div>
                    <Button className="shrink-0">Criar Regra de Automação</Button>
                </div>
            </div>
        </div>
    );
}
