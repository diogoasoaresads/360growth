"use client";

import { useState } from "react";
import {
    DndContext,
    DragOverlay,
    closestCorners,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragStartEvent,
    DragOverEvent,
    DragEndEvent,
    defaultDropAnimationSideEffects,
} from "@dnd-kit/core";
import {
    sortableKeyboardCoordinates,
} from "@dnd-kit/sortable";
import { PipelineColumn } from "./PipelineColumn";
import { DealCard } from "./DealCard";
import { updateDealStage } from "@/lib/actions/deal.actions";
import type { Deal, Client, DealStage } from "@/lib/db/schema";
import { toast } from "sonner";

interface DealWithClient extends Deal {
    client: Client | null;
}

interface PipelineBoardProps {
    initialDeals: DealWithClient[];
}

const STAGES: { key: DealStage; label: string; color: string }[] = [
    { key: "LEAD", label: "Lead", color: "bg-slate-50 border-slate-200" },
    { key: "QUALIFIED", label: "Qualificado", color: "bg-blue-50/50 border-blue-200" },
    { key: "PROPOSAL", label: "Proposta", color: "bg-purple-50/50 border-purple-200" },
    { key: "NEGOTIATION", label: "Negociação", color: "bg-amber-50/50 border-amber-200" },
    { key: "CLOSED_WON", label: "Ganho", color: "bg-green-50/50 border-green-200" },
    { key: "CLOSED_LOST", label: "Perdido", color: "bg-red-50/50 border-red-200" },
];

export function PipelineBoard({ initialDeals }: PipelineBoardProps) {
    const [deals, setDeals] = useState<DealWithClient[]>(initialDeals);
    const [activeDeal, setActiveDeal] = useState<DealWithClient | null>(null);

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8, // Avoid accidental drags
            },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const getDealsByStage = (stage: DealStage) => {
        return deals.filter((d) => d.stage === stage);
    };

    function handleDragStart(event: DragStartEvent) {
        const { active } = event;
        const deal = deals.find((d) => d.id === active.id);
        if (deal) setActiveDeal(deal);
    }

    function handleDragOver(event: DragOverEvent) {
        const { active, over } = event;
        if (!over) return;

        const activeId = active.id as string;
        const overId = over.id as string;

        const activeDeal = deals.find((d) => d.id === activeId);
        if (!activeDeal) return;

        // Over a column or another deal?
        const isOverAColumn = STAGES.some(s => s.key === overId);
        let newStage: DealStage;

        if (isOverAColumn) {
            newStage = overId as DealStage;
        } else {
            const overDeal = deals.find((d) => d.id === overId);
            if (!overDeal) return;
            newStage = overDeal.stage;
        }

        if (activeDeal.stage !== newStage) {
            setDeals((prev) => {
                const activeIndex = prev.findIndex((d) => d.id === activeId);
                const updatedDeals = [...prev];
                updatedDeals[activeIndex] = { ...activeDeal, stage: newStage };
                return updatedDeals;
            });
        }
    }

    async function handleDragEnd(event: DragEndEvent) {
        const { active, over } = event;
        setActiveDeal(null);

        if (!over) return;

        const activeId = active.id as string;
        const overId = over.id as string;

        const activeDeal = deals.find((d) => d.id === activeId);
        if (!activeDeal) return;

        const isOverAColumn = STAGES.some(s => s.key === overId);
        let newStage: DealStage;

        if (isOverAColumn) {
            newStage = overId as DealStage;
        } else {
            const overDeal = deals.find((d) => d.id === overId);
            newStage = overDeal ? overDeal.stage : activeDeal.stage;
        }

        // Persist change
        try {
            await updateDealStage(activeId, newStage);
            toast.success("Estágio atualizado");
        } catch {
            toast.error("Erro ao atualizar estágio");
            // Rollback on error
            setDeals(initialDeals);
        }
    }

    return (
        <DndContext
            sensors={sensors}
            collisionDetection={closestCorners}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragEnd={handleDragEnd}
        >
            <div className="flex gap-4 overflow-x-auto pb-6 h-full min-h-[calc(100vh-250px)]">
                {STAGES.map((stage) => (
                    <PipelineColumn
                        key={stage.key}
                        id={stage.key}
                        label={stage.label}
                        color={stage.color}
                        deals={getDealsByStage(stage.key)}
                    />
                ))}
            </div>

            <DragOverlay dropAnimation={{
                sideEffects: defaultDropAnimationSideEffects({
                    styles: {
                        active: {
                            opacity: "0.5",
                        },
                    },
                }),
            }}>
                {activeDeal ? <DealCard deal={activeDeal} /> : null}
            </DragOverlay>
        </DndContext>
    );
}
