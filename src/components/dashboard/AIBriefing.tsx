"use client";

import { Sparkles, TrendingUp, AlertCircle, CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useEffect, useState } from "react";

interface AIBriefingProps {
    userName: string;
    insights: string[];
}

export function AIBriefing({ userName, insights }: AIBriefingProps) {
    const [greeting, setGreeting] = useState("");

    useEffect(() => {
        const hour = new Date().getHours();
        if (hour < 12) setGreeting("Bom dia");
        else if (hour < 18) setGreeting("Boa tarde");
        else setGreeting("Boa noite");
    }, []);

    return (
        <div className="relative overflow-hidden rounded-3xl border border-white/40 dark:border-slate-800/50 bg-white/40 dark:bg-slate-900/40 backdrop-blur-2xl shadow-2xl shadow-indigo-500/10 p-6 mb-8 animate-in fade-in slide-in-from-top duration-700">
            {/* Background Orbs */}
            <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 w-64 h-64 bg-indigo-500/10 blur-[100px] rounded-full pointer-events-none" />
            <div className="absolute bottom-0 left-0 translate-y-1/2 -translate-x-1/2 w-64 h-64 bg-violet-500/10 blur-[100px] rounded-full pointer-events-none" />

            <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="space-y-2">
                    <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-semibold tracking-tight">
                        <Sparkles className="h-5 w-5 fill-current opacity-80" />
                        <span className="text-sm uppercase tracking-widest font-bold">Briefing de Inteligência</span>
                    </div>
                    <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                        {greeting}, <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-violet-500">{userName}</span>!
                    </h2>
                    <p className="text-slate-500 dark:text-slate-400 text-sm max-w-md leading-relaxed">
                        Analisei seus negócios e selecionei os pontos de atenção mais importantes para hoje.
                    </p>
                </div>

                <div className="flex flex-wrap gap-2">
                    <Badge variant="outline" className="bg-indigo-500/5 border-indigo-500/20 text-indigo-600 dark:text-indigo-300 py-1.5 px-3 rounded-full flex gap-2">
                        <TrendingUp className="h-3.5 w-3.5" />
                        Performance Alta
                    </Badge>
                </div>
            </div>

            <div className="relative mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {insights.length === 0 ? (
                    <div className="col-span-full py-8 text-center border-2 border-dashed rounded-2xl border-slate-200 dark:border-slate-800">
                        <p className="text-slate-500">Nenhum insight novo no momento. Tudo sob controle!</p>
                    </div>
                ) : (
                    insights.map((insight, idx) => (
                        <div
                            key={idx}
                            className="group relative bg-white/50 dark:bg-slate-900/50 border border-white/20 dark:border-slate-800 p-4 rounded-2xl transition-all duration-300 hover:scale-[1.02] hover:shadow-xl hover:border-indigo-500/30"
                        >
                            <div className="flex gap-4">
                                <div className="mt-1 h-8 w-8 shrink-0 rounded-full bg-indigo-500/10 flex items-center justify-center text-indigo-600 dark:text-indigo-400 group-hover:bg-indigo-500 group-hover:text-white transition-colors duration-300">
                                    {insight.includes("atrasada") || insight.includes("risco") ? (
                                        <AlertCircle className="h-4 w-4" />
                                    ) : (
                                        <CheckCircle2 className="h-4 w-4" />
                                    )}
                                </div>
                                <p className="text-sm text-slate-700 dark:text-slate-300 font-medium leading-snug">
                                    {insight}
                                </p>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
