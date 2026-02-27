"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { MoreHorizontal, Eye, Ban, CheckCircle, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ConfirmDialog } from "@/components/admin/confirm-dialog";
import {
  toggleAgencyStatus,
  deleteAgency,
} from "@/lib/actions/admin/agencies";
import type { AgencyListItem } from "@/lib/actions/admin/agencies";

interface AgencyRowActionsProps {
  agency: AgencyListItem;
}

export function AgencyRowActions({ agency }: AgencyRowActionsProps) {
  const [isPending, startTransition] = useTransition();
  const [deleteOpen, setDeleteOpen] = useState(false);

  const isActive = agency.agencyStatus === "active";

  function handleToggleStatus() {
    const newStatus = isActive ? "suspended" : "active";
    startTransition(async () => {
      const result = await toggleAgencyStatus(agency.id, newStatus);
      if (result.success) {
        toast.success(
          newStatus === "active" ? "Agência ativada" : "Agência suspensa"
        );
      } else {
        toast.error(result.error);
      }
    });
  }

  function handleDelete() {
    startTransition(async () => {
      const result = await deleteAgency(agency.id);
      if (result.success) {
        toast.success("Agência excluída com sucesso");
        setDeleteOpen(false);
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <MoreHorizontal className="h-4 w-4" />
            <span className="sr-only">Abrir menu</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuLabel>Ações</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild>
            <Link href={`/admin/agencies/${agency.id}`}>
              <Eye className="mr-2 h-4 w-4" />
              Ver detalhes
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={handleToggleStatus}
            disabled={isPending}
          >
            {isActive ? (
              <>
                <Ban className="mr-2 h-4 w-4" />
                Suspender
              </>
            ) : (
              <>
                <CheckCircle className="mr-2 h-4 w-4" />
                Ativar
              </>
            )}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className="text-destructive focus:text-destructive"
            onClick={() => setDeleteOpen(true)}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Excluir
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Excluir agência"
        description={`Tem certeza que deseja excluir a agência "${agency.name}"? Esta ação não pode ser desfeita.`}
        confirmText="Excluir"
        variant="destructive"
        onConfirm={handleDelete}
        loading={isPending}
      />
    </>
  );
}
