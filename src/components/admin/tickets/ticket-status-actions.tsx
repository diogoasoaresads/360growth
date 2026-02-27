"use client";

import { useTransition, useState } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { CheckCircle, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ConfirmDialog } from "@/components/admin/confirm-dialog";
import { updateTicketStatus, updateTicketPriority } from "@/lib/actions/admin/tickets";
import type { TicketStatus, TicketPriority } from "@/lib/db/schema";

interface TicketStatusActionsProps {
  ticketId: string;
  currentStatus: TicketStatus;
  currentPriority: TicketPriority;
}

const STATUS_OPTIONS: { value: TicketStatus; label: string }[] = [
  { value: "OPEN", label: "Aberto" },
  { value: "IN_PROGRESS", label: "Em andamento" },
  { value: "WAITING", label: "Aguardando" },
  { value: "RESOLVED", label: "Resolvido" },
  { value: "CLOSED", label: "Fechado" },
];

const PRIORITY_OPTIONS: { value: TicketPriority; label: string }[] = [
  { value: "LOW", label: "Baixa" },
  { value: "MEDIUM", label: "Média" },
  { value: "HIGH", label: "Alta" },
  { value: "URGENT", label: "Urgente" },
];

export function TicketStatusActions({
  ticketId,
  currentStatus,
  currentPriority,
}: TicketStatusActionsProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [closeOpen, setCloseOpen] = useState(false);

  function handleStatusChange(value: string) {
    startTransition(async () => {
      const result = await updateTicketStatus(ticketId, value as TicketStatus);
      if (result.success) {
        toast.success("Status atualizado");
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  }

  function handlePriorityChange(value: string) {
    startTransition(async () => {
      const result = await updateTicketPriority(ticketId, value as TicketPriority);
      if (result.success) {
        toast.success("Prioridade atualizada");
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  }

  function handleResolve() {
    startTransition(async () => {
      const result = await updateTicketStatus(ticketId, "RESOLVED");
      if (result.success) {
        toast.success("Ticket resolvido");
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  }

  function handleClose() {
    startTransition(async () => {
      const result = await updateTicketStatus(ticketId, "CLOSED");
      if (result.success) {
        toast.success("Ticket fechado");
        setCloseOpen(false);
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  }

  const isClosed = currentStatus === "CLOSED";
  const isResolved = currentStatus === "RESOLVED";

  return (
    <>
      <div className="space-y-3">
        <div>
          <p className="text-xs text-muted-foreground mb-1.5">Status</p>
          <Select
            value={currentStatus}
            onValueChange={handleStatusChange}
            disabled={isPending || isClosed}
          >
            <SelectTrigger className="h-8 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {STATUS_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <p className="text-xs text-muted-foreground mb-1.5">Prioridade</p>
          <Select
            value={currentPriority}
            onValueChange={handlePriorityChange}
            disabled={isPending || isClosed}
          >
            <SelectTrigger className="h-8 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PRIORITY_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {!isResolved && !isClosed && (
          <div className="space-y-2 pt-1">
            <Button
              variant="outline"
              size="sm"
              className="w-full text-green-600 border-green-200 hover:bg-green-50"
              onClick={handleResolve}
              disabled={isPending}
            >
              <CheckCircle className="h-4 w-4 mr-1.5" />
              Resolver ticket
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="w-full text-muted-foreground"
              onClick={() => setCloseOpen(true)}
              disabled={isPending}
            >
              <XCircle className="h-4 w-4 mr-1.5" />
              Fechar ticket
            </Button>
          </div>
        )}
      </div>

      <ConfirmDialog
        open={closeOpen}
        onOpenChange={setCloseOpen}
        title="Fechar ticket"
        description="Tem certeza que deseja fechar este ticket? Esta ação encerra definitivamente o suporte."
        confirmText="Fechar ticket"
        variant="destructive"
        onConfirm={handleClose}
        loading={isPending}
      />
    </>
  );
}
