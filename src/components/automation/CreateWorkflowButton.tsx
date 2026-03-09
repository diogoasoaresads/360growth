"use client";

import { useState, useEffect } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Plus, Zap, AlertCircle } from "lucide-react";
import { createWorkflow, getAgencyUsers } from "@/lib/actions/automation.actions";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { AutomationTrigger, AutomationActionType } from "@/lib/db/schema";

export function CreateWorkflowButton() {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const [name, setName] = useState("");
    const [trigger, setTrigger] = useState<AutomationTrigger>("DEAL_STAGE_CHANGED");
    const [conditionValue, setConditionValue] = useState("");
    const [actionType, setActionType] = useState<AutomationActionType>("CREATE_TASK");
    const [actionTitle, setActionTitle] = useState("");
    const [responsibleId, setResponsibleId] = useState<string>("");
    const [users, setUsers] = useState<{ id: string; name: string | null; email: string }[]>([]);

    useEffect(() => {
        if (open) {
            getAgencyUsers().then(setUsers);
        }
    }, [open]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name || !actionTitle) {
            toast.error("Preencha todos os campos");
            return;
        }

        setLoading(true);
        try {
            const conditions: Record<string, string> = {};
            if (trigger === "DEAL_STAGE_CHANGED") conditions.stage = conditionValue;
            if (trigger === "TICKET_STATUS_CHANGED") conditions.status = conditionValue;

            await createWorkflow({
                name,
                triggerEvent: trigger,
                triggerConditions: conditions,
                actions: [
                    {
                        type: actionType,
                        payload: {
                            title: actionTitle,
                            description: `Criado automaticamente via: ${name}`,
                            daysOffset: 1,
                            responsibleId: responsibleId || null,
                            templateKey: actionType === "SEND_EMAIL" ? actionTitle : undefined,
                        },
                    },
                ],
                isActive: true,
            });

            toast.success("Automação criada com sucesso!");
            setOpen(false);
            resetForm();
            router.refresh();
        } catch {
            toast.error("Erro ao criar automação");
        } finally {
            setLoading(false);
        }
    };

    const resetForm = () => {
        setName("");
        setTrigger("DEAL_STAGE_CHANGED");
        setConditionValue("");
        setActionTitle("");
        setResponsibleId("");
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className="gap-2">
                    <Plus className="h-4 w-4" /> Nova Automação
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
                <form onSubmit={handleSubmit}>
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Zap className="h-5 w-5 text-primary" /> Criar Regra de Automação
                        </DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-6 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">Nome da Automação</Label>
                            <Input
                                id="name"
                                placeholder="Ex: Tarefa de Onboarding ao Ganhar Negócio"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Gatilho (Trigger)</Label>
                                <Select value={trigger} onValueChange={(v) => setTrigger(v as AutomationTrigger)}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="DEAL_STAGE_CHANGED">Estágio do Deal</SelectItem>
                                        <SelectItem value="TICKET_CREATED">Ticket Criado</SelectItem>
                                        <SelectItem value="TICKET_STATUS_CHANGED">Status do Ticket</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            {(trigger === "DEAL_STAGE_CHANGED" || trigger === "TICKET_STATUS_CHANGED") && (
                                <div className="space-y-2">
                                    <Label>Se o valor for:</Label>
                                    <Input
                                        placeholder={trigger === "DEAL_STAGE_CHANGED" ? "Ex: CLOSED_WON" : "Ex: RESOLVED"}
                                        value={conditionValue}
                                        onChange={(e) => setConditionValue(e.target.value)}
                                    />
                                </div>
                            )}
                        </div>

                        <div className="p-4 border rounded-lg bg-primary/5 space-y-4">
                            <h4 className="text-sm font-semibold flex items-center gap-2">
                                <Zap className="h-4 w-4 text-primary" /> Ação a Executar
                            </h4>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Tipo de Ação</Label>
                                    <Select value={actionType} onValueChange={(v) => setActionType(v as AutomationActionType)}>
                                        <SelectTrigger className="bg-background">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="CREATE_TASK">Criar Tarefa</SelectItem>
                                            <SelectItem value="SEND_NOTIFICATION">Notificar Equipe</SelectItem>
                                            <SelectItem value="SEND_EMAIL">Enviar E-mail</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label>{actionType === "SEND_EMAIL" ? "Template / Chave" : "Título/Mensagem"}</Label>
                                    <Input
                                        className="bg-background"
                                        placeholder={actionType === "SEND_EMAIL" ? "Ex: WELCOME_EMAIL" : "Ex: Preparar contrato"}
                                        value={actionTitle}
                                        onChange={(e) => setActionTitle(e.target.value)}
                                    />
                                </div>
                                {actionType === "CREATE_TASK" && (
                                    <div className="col-span-2 space-y-2">
                                        <Label>Responsável (Opcional)</Label>
                                        <Select value={responsibleId} onValueChange={setResponsibleId}>
                                            <SelectTrigger className="bg-background">
                                                <SelectValue placeholder="Selecione um usuário" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="UNASSIGNED">Não atribuído (Padrão)</SelectItem>
                                                {users.map((user) => (
                                                    <SelectItem key={user.id} value={user.id}>
                                                        {user.name || user.email}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="flex items-center gap-2 p-3 bg-amber-50 rounded-md border border-amber-200 text-amber-800 text-[10px]">
                            <AlertCircle className="h-4 w-4" />
                            <span>DICA: Use nomes de estágios técnicos (ex: CLOSED_WON, QUALIFIED).</span>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" type="button" onClick={() => setOpen(false)}>
                            Cancelar
                        </Button>
                        <Button type="submit" disabled={loading}>
                            {loading ? "Criando..." : "Salvar Automação"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
