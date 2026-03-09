"use client";

import { useState } from "react";
import { AutomationWorkflow } from "@/lib/db/schema";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Trash2, Zap, ArrowRight, ClipboardList, Bell } from "lucide-react";
import { toggleWorkflow, deleteWorkflow } from "@/lib/actions/automation.actions";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface AutomationListProps {
    initialWorkflows: AutomationWorkflow[];
}

export function AutomationList({ initialWorkflows }: AutomationListProps) {
    const [workflows, setWorkflows] = useState(initialWorkflows);
    const router = useRouter();

    const handleToggle = async (id: string, currentValue: boolean) => {
        try {
            const newValue = !currentValue;
            await toggleWorkflow(id, newValue);
            setWorkflows(prev =>
                prev.map(w => w.id === id ? { ...w, isActive: newValue } : w)
            );
            toast.success(newValue ? "Automação ativada" : "Automação pausada");
        } catch {
            toast.error("Erro ao alterar status");
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Tem certeza que deseja excluir esta automação?")) return;
        try {
            await deleteWorkflow(id);
            setWorkflows(prev => prev.filter(w => w.id !== id));
            toast.success("Automação excluída");
            router.refresh();
        } catch {
            toast.error("Erro ao excluir");
        }
    };

    const triggerLabels: Record<string, string> = {
        DEAL_STAGE_CHANGED: "Mudar estágio do Negócio",
        TICKET_CREATED: "Ticket criado",
        TICKET_STATUS_CHANGED: "Mudar status do Ticket",
    };

    return (
        <div className="grid gap-4">
            {workflows.map((workflow) => (
                <Card key={workflow.id} className={!workflow.isActive ? "opacity-60" : ""}>
                    <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-primary/10 rounded-full">
                                <Zap className="h-4 w-4 text-primary" />
                            </div>
                            <div>
                                <CardTitle className="text-base">{workflow.name}</CardTitle>
                                <CardDescription className="flex items-center gap-2 mt-1">
                                    <Badge variant="outline" className="text-[10px] font-mono">
                                        {triggerLabels[workflow.triggerEvent] || workflow.triggerEvent}
                                    </Badge>
                                    {workflow.triggerConditions && Object.keys(workflow.triggerConditions).length > 0 && (
                                        <span className="text-[10px] text-muted-foreground italic">
                                            Se: {JSON.stringify(workflow.triggerConditions).replace(/[{}"]/g, "")}
                                        </span>
                                    )}
                                </CardDescription>
                            </div>
                        </div>
                        <div className="flex items-center gap-4">
                            <Switch
                                checked={workflow.isActive}
                                onCheckedChange={() => handleToggle(workflow.id, workflow.isActive)}
                            />
                            <Button variant="ghost" size="icon" onClick={() => handleDelete(workflow.id)}>
                                <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-col gap-2">
                            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Ações</p>
                            {workflow.actions.map((action, idx) => (
                                <div key={idx} className="flex items-center gap-3 p-2 bg-muted/40 rounded border border-muted-foreground/10 text-sm">
                                    {action.type === "CREATE_TASK" ? (
                                        <ClipboardList className="h-3.5 w-3.5 text-blue-500" />
                                    ) : (
                                        <Bell className="h-3.5 w-3.5 text-orange-500" />
                                    )}
                                    <ArrowRight className="h-3 w-3 text-muted-foreground" />
                                    <span className="font-medium">
                                        {action.type === "CREATE_TASK" ? "Criar Tarefa: " : "Notificar: "}
                                        {String(action.payload.title || action.payload.message)}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}
