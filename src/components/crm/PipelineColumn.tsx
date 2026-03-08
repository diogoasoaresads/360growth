"use client";

import { useDroppable } from "@dnd-kit/core";
import {
    SortableContext,
    verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { Badge } from "@/components/ui/badge";
import { DealCard } from "./DealCard";
import type { Deal, Client, User } from "@/lib/db/schema";
import { cn } from "@/lib/utils";
import { Plus } from "lucide-react";
import Link from "next/link";

interface DealExtended extends Deal {
    client: Client | null;
    responsible: User | null;
}

interface PipelineColumnProps {
    id: string;
    label: string;
    color: string;
    deals: DealExtended[];
    onDealClick: (deal: DealExtended) => void;
}

export function PipelineColumn({ id, label, color, deals, onDealClick }: PipelineColumnProps) {
    const { setNodeRef, isOver } = useDroppable({
        id,
        data: {
            type: "Column",
            stageId: id,
        },
    });

    const totalValue = deals.reduce(
        (sum, d) => sum + Number(d.value || 0),
        0
    );

    return (
        <div
            ref={setNodeRef}
            className={cn(
                "flex-shrink-0 w-80 rounded-xl border-2 p-3 transition-colors flex flex-col gap-3",
                isOver && "ring-2 ring-primary ring-offset-2 bg-primary/5"
            )}
            style={{ borderColor: color + '20', backgroundColor: color + '05' }}
        >
            <div className="flex items-center justify-between px-1">
                <div>
                    <h3 className="font-bold text-sm tracking-tight">{label}</h3>
                    <p className="text-[11px] text-muted-foreground font-medium">
                        {deals.length} negócio{deals.length !== 1 ? "s" : ""}
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    {totalValue > 0 && (
                        <Badge variant="secondary" className="text-[10px] font-bold bg-background/50">
                            {totalValue.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                        </Badge>
                    )}
                    <Link
                        href="/agency/crm/clients"
                        className="h-6 w-6 flex items-center justify-center rounded-md hover:bg-background/50 text-muted-foreground hover:text-primary transition-colors border border-transparent hover:border-sidebar-border"
                        title="Adicionar Negócio"
                    >
                        <Plus className="h-3.5 w-3.5" />
                    </Link>
                </div>
            </div>

            <div className="flex-1 space-y-2.5 min-h-[500px]">
                <SortableContext
                    items={deals.map((d) => d.id)}
                    strategy={verticalListSortingStrategy}
                >
                    {deals.length === 0 ? (
                        <div className="flex items-center justify-center h-24 rounded-lg border-2 border-dashed border-muted-foreground/10">
                            <p className="text-[10px] text-muted-foreground font-medium">Vazio</p>
                        </div>
                    ) : (
                        deals.map((deal) => (
                            <div key={deal.id} onClick={() => onDealClick(deal)}>
                                <DealCard deal={deal} />
                            </div>
                        ))
                    )}
                </SortableContext>
            </div>
        </div>
    );
}
