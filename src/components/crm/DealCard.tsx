"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Card, CardContent } from "@/components/ui/card";
import type { Deal, Client, User } from "@/lib/db/schema";
import { differenceInDays } from "date-fns";
import { ExternalLink, User as UserIcon, Tag, Globe, Flame, AlertTriangle, Moon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

import { calculateDealScore, getPriorityLabel, type DealScoreInput } from "@/lib/crm/crm-intelligence";

interface DealExtended extends Deal {
    client: Client | null;
    responsible: User | null;
}

interface DealCardProps {
    deal: DealExtended;
}

export function DealCard({ deal }: DealCardProps) {
    const daysSinceUpdate = differenceInDays(new Date(), new Date(deal.lastActivityAt || deal.updatedAt));

    // Aging Logic: Recent (< 3d), Attention (3-7d), Stalled (> 7d)
    const agingColor = daysSinceUpdate < 3 ? "bg-green-500" : daysSinceUpdate < 7 ? "bg-amber-500" : "bg-red-500";
    const agingLabel = daysSinceUpdate === 0 ? "Hoje" : `Há ${daysSinceUpdate} d`;

    const score = calculateDealScore(deal as DealScoreInput);
    const priority = getPriorityLabel(score);

    const PriorityIcon = priority.icon === "Flame" ? Flame : priority.icon === "AlertTriangle" ? AlertTriangle : Moon;

    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({
        id: deal.id,
        data: {
            type: "Deal",
            deal,
        },
    });

    const style = {
        transition,
        transform: CSS.Translate.toString(transform),
    };

    if (isDragging) {
        return (
            <div
                ref={setNodeRef}
                style={style}
                className="opacity-30 border-2 border-primary border-dashed rounded-lg h-[120px] w-full"
            />
        );
    }

    return (
        <Card
            ref={setNodeRef}
            style={style}
            {...attributes}
            {...listeners}
            className="shadow-sm hover-lift active:cursor-grabbing select-none group border-l-4 border-l-transparent hover:border-l-primary"
        >
            <CardContent className="p-3 space-y-3">
                <div className="flex items-start justify-between gap-2">
                    <div className="flex flex-col gap-1 min-w-0">
                        <div className="flex items-center gap-2">
                            <div className={cn("h-2 w-2 rounded-full shrink-0 shadow-[0_0_8px_rgba(0,0,0,0.1)]", agingColor)} title={`Última atividade: ${agingLabel}`} />
                            <p className="font-bold text-sm group-hover:text-primary transition-colors truncate leading-none text-slate-900 dark:text-slate-100">
                                {deal.title}
                            </p>
                        </div>
                        <div className="flex items-center gap-2 ml-4">
                            <p className="text-[11px] text-muted-foreground truncate font-medium">
                                {deal.client?.name ?? "---"}
                            </p>
                            <span className={cn(
                                "inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[9px] font-black uppercase tracking-tighter transition-all duration-300",
                                score > 70 ? "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20" :
                                    score > 40 ? "bg-amber-500/10 text-amber-600 border border-amber-500/20" :
                                        "bg-rose-500/10 text-rose-600 border border-rose-500/20"
                            )}>
                                <PriorityIcon className="h-2.5 w-2.5" />
                                SCORE {score}
                            </span>
                        </div>
                    </div>
                    <button
                        onPointerDown={(e) => e.stopPropagation()}
                        onClick={(e) => {
                            e.stopPropagation();
                            window.location.href = `/agency/crm/clients?clientId=${deal.clientId}`;
                        }}
                        className="h-6 w-6 flex items-center justify-center rounded-md hover:bg-muted text-muted-foreground hover:text-primary transition-colors opacity-0 group-hover:opacity-100 shrink-0"
                    >
                        <ExternalLink className="h-3.5 w-3.5" />
                    </button>
                </div>

                {/* Tags and Lead Source */}
                <div className="flex flex-wrap gap-1 ml-3.5">
                    {deal.leadSource && (
                        <Badge variant="secondary" className="px-1.5 py-0 h-4 text-[9px] font-medium bg-blue-50 text-blue-700 border-blue-100 flex items-center gap-1">
                            <Globe className="h-2 w-2" />
                            {deal.leadSource}
                        </Badge>
                    )}
                    {deal.tags?.slice(0, 2).map(tag => (
                        <Badge key={tag} variant="outline" className="px-1.5 py-0 h-4 text-[9px] font-medium">
                            <Tag className="h-2 w-2 mr-1" />
                            {tag}
                        </Badge>
                    ))}
                </div>

                <div className="flex items-center justify-between pt-1 ml-3.5">
                    <div className="flex flex-col">
                        <span className="text-[9px] text-muted-foreground uppercase font-bold tracking-tight">Valor</span>
                        <p className="text-sm font-bold text-foreground">
                            {deal.value ? Number(deal.value).toLocaleString("pt-BR", { style: "currency", currency: deal.currency || "BRL" }) : "R$ 0,00"}
                        </p>
                    </div>

                    <div className="flex flex-col items-end">
                        <span className="text-[9px] text-muted-foreground uppercase font-bold tracking-tight">Responsável</span>
                        <div className="flex items-center gap-1.5 mt-0.5">
                            <div className="h-5 w-5 rounded-full bg-muted flex items-center justify-center border text-muted-foreground">
                                <UserIcon className="h-3 w-3" />
                            </div>
                            <span className="text-[10px] font-medium truncate max-w-[60px]">
                                {deal.responsible?.name?.split(' ')[0] || "---"}
                            </span>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
