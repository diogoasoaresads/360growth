"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { TaskStatus } from "@/lib/db/schema";
import { updateTaskStatus } from "@/lib/actions/automation.actions";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Check } from "lucide-react";

interface TaskActionsProps {
    taskId: string;
    currentStatus: TaskStatus;
}

export function TaskActions({ taskId, currentStatus }: TaskActionsProps) {
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleStatusChange = async (newStatus: TaskStatus) => {
        setLoading(true);
        try {
            await updateTaskStatus(taskId, newStatus);
            toast.success("Status atualizado");
            router.refresh();
        } catch {
            toast.error("Erro ao atualizar tarefa");
        } finally {
            setLoading(false);
        }
    };

    if (currentStatus === "COMPLETED") return null;

    return (
        <div className="flex justify-end pt-2">
            <Button
                variant="outline"
                size="sm"
                className="h-7 text-[10px] gap-1 hover:bg-green-50 hover:text-green-600 hover:border-green-200 transition-colors"
                onClick={() => handleStatusChange("COMPLETED")}
                disabled={loading}
            >
                <Check className="h-3 w-3" />
                Concluir Tarefa
            </Button>
        </div>
    );
}
