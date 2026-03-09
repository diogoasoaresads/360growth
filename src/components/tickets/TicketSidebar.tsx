"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { updateTicketStatus } from "@/lib/actions/ticket.actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";

interface TicketSidebarProps {
    ticketId: string;
    currentStatus: string;
    currentPriority: string;
}

export function TicketSidebar({ ticketId, currentStatus, currentPriority }: TicketSidebarProps) {
    const [isPending, startTransition] = useTransition();

    function onStatusChange(value: string) {
        startTransition(async () => {
            try {
                await updateTicketStatus(ticketId, { status: value as "OPEN" | "IN_PROGRESS" | "WAITING" | "RESOLVED" | "CLOSED" });
                toast.success("Status atualizado");
            } catch {
                toast.error("Erro ao atualizar status");
            }
        });
    }

    function onPriorityChange(value: string) {
        startTransition(async () => {
            try {
                await updateTicketStatus(ticketId, { priority: value as "LOW" | "MEDIUM" | "HIGH" | "URGENT" });
                toast.success("Prioridade atualizada");
            } catch {
                toast.error("Erro ao atualizar prioridade");
            }
        });
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-sm font-medium">Detalhes do Ticket</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="space-y-2">
                    <Label>Status</Label>
                    <Select disabled={isPending} defaultValue={currentStatus} onValueChange={onStatusChange}>
                        <SelectTrigger>
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="OPEN">Aberto</SelectItem>
                            <SelectItem value="IN_PROGRESS">Em Progresso</SelectItem>
                            <SelectItem value="WAITING">Aguardando</SelectItem>
                            <SelectItem value="RESOLVED">Resolvido</SelectItem>
                            <SelectItem value="CLOSED">Fechado</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <div className="space-y-2">
                    <Label>Prioridade</Label>
                    <Select disabled={isPending} defaultValue={currentPriority} onValueChange={onPriorityChange}>
                        <SelectTrigger>
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="LOW">Baixa</SelectItem>
                            <SelectItem value="MEDIUM">Média</SelectItem>
                            <SelectItem value="HIGH">Alta</SelectItem>
                            <SelectItem value="URGENT">Urgente</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </CardContent>
        </Card>
    );
}
