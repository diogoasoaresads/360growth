"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Card, CardContent } from "@/components/ui/card";
import type { Deal, Client } from "@/lib/db/schema";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ExternalLink } from "lucide-react";

interface DealWithClient extends Deal {
    client: Client | null;
}

interface DealCardProps {
    deal: DealWithClient;
}

export function DealCard({ deal }: DealCardProps) {
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
                className="opacity-30 border-2 border-primary border-dashed rounded-lg h-[100px] w-full"
            />
        );
    }

    return (
        <Card
            ref={setNodeRef}
            style={style}
            {...attributes}
            {...listeners}
            className="shadow-sm cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow select-none group"
        >
            <CardContent className="p-3">
                <div className="flex items-start justify-between gap-2">
                    <div className="flex flex-col gap-1 min-w-0">
                        <p className="font-semibold text-sm group-hover:text-primary transition-colors truncate">{deal.title}</p>
                        <p className="text-[11px] text-muted-foreground truncate">
                            {deal.client?.name ?? "Cliente não identificado"}
                        </p>
                    </div>
                    <button
                        onPointerDown={(e) => e.stopPropagation()} // Prevent drag when clicking button
                        onClick={(e) => {
                            e.stopPropagation();
                            window.location.href = `/agency/crm/clients?clientId=${deal.clientId}`;
                        }}
                        className="h-6 w-6 flex items-center justify-center rounded-md hover:bg-muted text-muted-foreground hover:text-primary transition-colors opacity-0 group-hover:opacity-100"
                    >
                        <ExternalLink className="h-3.5 w-3.5" />
                    </button>
                </div>

                <div className="flex items-center justify-between mt-3">
                    {deal.value ? (
                        <p className="text-sm font-bold text-foreground">
                            R$ {parseFloat(deal.value).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                        </p>
                    ) : (
                        <span className="text-[10px] text-muted-foreground italic">Sem valor</span>
                    )}

                    <span className="text-[10px] text-muted-foreground/60">
                        {formatDistanceToNow(new Date(deal.createdAt), { locale: ptBR })}
                    </span>
                </div>
            </CardContent>
        </Card>
    );
}
