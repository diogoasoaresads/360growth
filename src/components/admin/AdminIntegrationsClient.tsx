"use client";

import { useState } from "react";
import {
    CheckCircle2,
    AlertCircle,
    Search,
    Plug,
    Building2,
    Calendar,
    ExternalLink
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface AdminIntegration {
    id: string;
    provider: string;
    status: string;
    accountLabel: string | null;
    createdAt: Date;
    agency: {
        id: string;
        name: string;
    };
}

interface AdminIntegrationsClientProps {
    initialIntegrations: AdminIntegration[];
    stats: {
        total: number;
        connected: number;
        error: number;
        byProvider: Record<string, number>;
    };
}

export function AdminIntegrationsClient({
    initialIntegrations,
    stats
}: AdminIntegrationsClientProps) {
    const [search, setSearch] = useState("");
    const [filter, setFilter] = useState<string>("all");

    const filteredIntegrations = initialIntegrations.filter(item => {
        const matchesSearch =
            item.agency.name.toLowerCase().includes(search.toLowerCase()) ||
            item.provider.toLowerCase().includes(search.toLowerCase()) ||
            item.accountLabel?.toLowerCase().includes(search.toLowerCase());

        const matchesFilter = filter === "all" || item.status === filter;

        return matchesSearch && matchesFilter;
    });

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="glass-card overflow-hidden border-none shadow-xl shadow-slate-200/50">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Total de Conexões</p>
                                <h3 className="text-3xl font-bold tracking-tight mt-1">{stats.total}</h3>
                            </div>
                            <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                                <Plug className="h-6 w-6" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="glass-card overflow-hidden border-none shadow-xl shadow-slate-200/50">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Ativas & Saudáveis</p>
                                <h3 className="text-3xl font-bold tracking-tight mt-1 text-emerald-600">{stats.connected}</h3>
                            </div>
                            <div className="h-12 w-12 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600">
                                <CheckCircle2 className="h-6 w-6" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="glass-card overflow-hidden border-none shadow-xl shadow-slate-200/50">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Com Erro / Críticas</p>
                                <h3 className="text-3xl font-bold tracking-tight mt-1 text-rose-600">{stats.error}</h3>
                            </div>
                            <div className="h-12 w-12 rounded-2xl bg-rose-50 flex items-center justify-center text-rose-600">
                                <AlertCircle className="h-6 w-6" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Filter Toolbar */}
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between p-4 glass-card rounded-2xl border-none shadow-lg shadow-slate-100/50">
                <div className="relative w-full md:w-96">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Buscar por agência ou provedor..."
                        className="pl-10 bg-white/50 border-none shadow-sm focus-visible:ring-primary/20 rounded-xl"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>

                <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
                    <Button
                        variant={filter === "all" ? "default" : "ghost"}
                        size="sm"
                        onClick={() => setFilter("all")}
                        className="rounded-full px-4"
                    >
                        Todas
                    </Button>
                    <Button
                        variant={filter === "connected" ? "default" : "ghost"}
                        size="sm"
                        onClick={() => setFilter("connected")}
                        className="rounded-full px-4 gap-2"
                    >
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Saudáveis
                    </Button>
                    <Button
                        variant={filter === "error" ? "default" : "ghost"}
                        size="sm"
                        onClick={() => setFilter("error")}
                        className="rounded-full px-4 gap-2"
                    >
                        <AlertCircle className="h-3.5 w-3.5" />
                        Alertas
                    </Button>
                </div>
            </div>

            {/* List */}
            <div className="grid gap-4">
                {filteredIntegrations.length === 0 ? (
                    <div className="flex flex-col items-center justify-center p-20 glass-card rounded-3xl border-dashed border-2 border-slate-200 text-center">
                        <Plug className="h-12 w-12 text-slate-300 mb-4" />
                        <h4 className="text-lg font-semibold text-slate-900">Nenhuma integração encontrada</h4>
                        <p className="text-sm text-slate-500 max-w-xs mt-1">Ajuste os filtros ou verifique se as agências já iniciaram suas conexões.</p>
                    </div>
                ) : (
                    filteredIntegrations.map((item) => (
                        <Card key={item.id} className="group hover:shadow-2xl hover:shadow-primary/5 transition-all duration-300 border-none shadow-md shadow-slate-200/40 rounded-2xl overflow-hidden">
                            <CardContent className="p-0">
                                <div className="flex flex-col md:flex-row items-center gap-6 p-6">
                                    <div className="h-14 w-14 rounded-2xl bg-slate-50 border flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform duration-500 shadow-sm">
                                        {/* Dynamic Icon placeholder based on provider */}
                                        <Plug className="h-6 w-6 text-slate-600" />
                                    </div>

                                    <div className="flex-1 min-w-0 text-center md:text-left space-y-1">
                                        <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
                                            <h4 className="text-base font-bold text-slate-900 group-hover:text-primary transition-colors truncate">
                                                {item.provider}
                                            </h4>
                                            <Badge className={cn(
                                                "rounded-full text-[10px] font-black uppercase tracking-wider px-2",
                                                item.status === "connected"
                                                    ? "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20"
                                                    : "bg-rose-500/10 text-rose-600 border border-rose-500/20"
                                            )}>
                                                {item.status === "connected" ? "Conectado" : "Erro de Sync"}
                                            </Badge>
                                        </div>
                                        <div className="flex items-center justify-center md:justify-start gap-4 text-xs text-muted-foreground font-medium">
                                            <div className="flex items-center gap-1.5">
                                                <Building2 className="h-3.5 w-3.5" />
                                                <span className="text-slate-700 font-bold">{item.agency.name}</span>
                                            </div>
                                            <div className="hidden md:flex items-center gap-1.5">
                                                <Calendar className="h-3.5 w-3.5" />
                                                <span>{format(new Date(item.createdAt), "dd MMM yyyy", { locale: ptBR })}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3 shrink-0">
                                        <Button variant="outline" size="sm" className="rounded-full shadow-sm hover:bg-slate-50 h-9 transition-all">
                                            Logs Detalhados
                                        </Button>
                                        <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full group-hover:bg-primary/5 transition-all">
                                            <ExternalLink className="h-4 w-4 text-slate-400 group-hover:text-primary" />
                                        </Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )
                    )
                )}
            </div>
        </div>
    );
}
