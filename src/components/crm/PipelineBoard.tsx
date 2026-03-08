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
import { toast } from "sonner";
import { DealDetailsDrawer } from "./DealDetailsDrawer";

interface DealExtended extends Deal {
    client: Client | null;
    responsible: User | null;
    stage?: PipelineStage | null;
}


interface PipelineBoardProps {
    initialDeals: DealExtended[];
    stages: PipelineStage[];
}

export function PipelineBoard({ initialDeals, stages }: PipelineBoardProps) {
    const [deals, setDeals] = useState<DealExtended[]>(initialDeals);
    const [activeDeal, setActiveDeal] = useState<DealExtended | null>(null);
    const [selectedDeal, setSelectedDeal] = useState<DealExtended | null>(null);

    // Filter deals by stage
    const getDealsByStage = (stageId: string) => {
        return deals.filter((d) => d.stageId === stageId);
    };

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8,
            },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

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
        const isOverAColumn = stages.some(s => s.id === overId);
        let newStageId: string;

        if (isOverAColumn) {
            newStageId = overId;
        } else {
            const overDeal = deals.find((d) => d.id === overId);
            if (!overDeal) return;
            newStageId = overDeal.stageId!;
        }

        if (activeDeal.stageId !== newStageId) {
            setDeals((prev) => {
                const activeIndex = prev.findIndex((d) => d.id === activeId);
                const updatedDeals = [...prev];
                updatedDeals[activeIndex] = { ...activeDeal, stageId: newStageId };
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

        const isOverAColumn = stages.some(s => s.id === overId);
        let newStageId: string;

        if (isOverAColumn) {
            newStageId = overId;
        } else {
            const overDeal = deals.find((d) => d.id === overId);
            newStageId = overDeal ? overDeal.stageId! : activeDeal.stageId!;
        }

        // Persist change
        try {
            await updateDealStage(activeId, newStageId);
            toast.success("Estágio atualizado");
        } catch {
            toast.error("Erro ao atualizar estágio");
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
                {stages.map((stage) => (
                    <PipelineColumn
                        key={stage.id}
                        id={stage.id}
                        label={stage.name}
                        color={stage.color || "#cbd5e1"}
                        deals={getDealsByStage(stage.id).map(d => ({ ...d, stage }))}
                        onDealClick={(deal) => setSelectedDeal({ ...deal, stage })}
                    />
                ))}
                {stages.length === 0 && (
                    <div className="flex flex-col items-center justify-center w-full min-h-[400px] border-2 border-dashed rounded-xl border-muted-foreground/25">
                        <p className="text-muted-foreground">Nenhum estágio configurado nesta pipeline.</p>
                    </div>
                )}
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

            <DealDetailsDrawer
                deal={selectedDeal}
                isOpen={!!selectedDeal}
                onClose={() => setSelectedDeal(null)}
            />
        </DndContext>
    );
}
