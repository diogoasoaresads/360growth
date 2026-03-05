"use client";

import { useDroppable } from "@dnd-kit/core";
import {
    SortableContext,
    verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { Badge } from "@/components/ui/badge";
import { DealCard } from "./DealCard";
import type { Deal, Client, DealStage } from "@/lib/db/schema";
import { cn } from "@/lib/utils";

interface DealWithClient extends Deal {
    client: Client | null;
}

interface PipelineColumnProps {
    id: DealStage;
    label: string;
    color: string;
    deals: DealWithClient[];
}

export function PipelineColumn({ id, label, color, deals }: PipelineColumnProps) {
    const { setNodeRef, isOver } = useDroppable({
        id,
        data: {
            type: "Column",
            stage: id,
        },
    });

    const totalValue = deals.reduce(
        (sum, d) => sum + parseFloat(d.value ?? "0"),
        0
    );

    return (
        <div
            ref={setNodeRef}
            className={cn(
                "flex-shrink-0 w-80 rounded-xl border-2 p-3 transition-colors flex flex-col gap-3",
                color,
                isOver && "ring-2 ring-primary ring-offset-2 bg-primary/5"
            )}
        >
            <div className="flex items-center justify-between px-1">
                <div>
                    <h3 className="font-bold text-sm tracking-tight">{label}</h3>
                    <p className="text-[11px] text-muted-foreground font-medium">
                        {deals.length} negócio{deals.length !== 1 ? "s" : ""}
                    </p>
                </div>
                {totalValue > 0 && (
                    <Badge variant="secondary" className="text-[10px] font-bold bg-background/50">
                        R$ {totalValue.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                    </Badge>
                )}
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
                            <DealCard key={deal.id} deal={deal} />
                        ))
                    )}
                </SortableContext>
            </div>
        </div>
    );
}
