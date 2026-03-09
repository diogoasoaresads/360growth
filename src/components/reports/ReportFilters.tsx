"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Download, Filter } from "lucide-react";
import { exportDealsCSV, exportTicketsCSV } from "@/lib/actions/report.actions";
import { toast } from "sonner";

export function ReportFilters() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const currentRange = searchParams.get("range") || "all";

    const handleRangeChange = (value: string) => {
        const params = new URLSearchParams(searchParams.toString());
        params.set("range", value);
        router.push(`?${params.toString()}`);
    };

    const downloadCSV = async (type: 'deals' | 'tickets') => {
        try {
            toast.promise(
                async () => {
                    const csv = type === 'deals' ? await exportDealsCSV() : await exportTicketsCSV();
                    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
                    const link = document.createElement("a");
                    const url = URL.createObjectURL(blob);
                    link.setAttribute("href", url);
                    link.setAttribute("download", `relatorio-${type}-${new Date().toISOString().split('T')[0]}.csv`);
                    link.style.visibility = 'hidden';
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                },
                {
                    loading: `Gerando CSV de ${type}...`,
                    success: `Relatório de ${type} baixado com sucesso!`,
                    error: "Erro ao gerar relatório."
                }
            );
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-8 print:hidden">
            <div className="flex items-center gap-2 w-full sm:w-auto">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <Select value={currentRange} onValueChange={handleRangeChange}>
                    <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Período" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Todo o período</SelectItem>
                        <SelectItem value="7d">Últimos 7 dias</SelectItem>
                        <SelectItem value="30d">Últimos 30 dias</SelectItem>
                        <SelectItem value="90d">Últimos 90 dias</SelectItem>
                        <SelectItem value="this_month">Este mês</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
                <Button variant="outline" size="sm" onClick={() => downloadCSV('deals')}>
                    <Download className="mr-2 h-4 w-4" />
                    Exportar Deals (CSV)
                </Button>
                <Button variant="outline" size="sm" onClick={() => downloadCSV('tickets')}>
                    <Download className="mr-2 h-4 w-4" />
                    Exportar Tickets (CSV)
                </Button>
            </div>
        </div>
    );
}
