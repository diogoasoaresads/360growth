"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  MoreHorizontal,
  Eye,
  KeyRound,
  UserCog,
  Ban,
  CheckCircle,
} from "lucide-react";
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
  toggleUserStatus,
  sendPasswordReset,
} from "@/lib/actions/admin/users";
import { impersonateUser } from "@/lib/actions/admin/impersonate";
import type { UserWithAgency } from "@/lib/actions/admin/users";

interface UserRowActionsProps {
  user: UserWithAgency;
}

export function UserRowActions({ user }: UserRowActionsProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [suspendOpen, setSuspendOpen] = useState(false);

  const isActive = user.userStatus === "active";
  const canImpersonate = user.role !== "SUPER_ADMIN";

  function handleToggleStatus() {
    startTransition(async () => {
      const result = await toggleUserStatus(user.id);
      if (result.success) {
        toast.success(
          result.data.userStatus === "suspended"
            ? "Usuário suspenso"
            : "Usuário ativado"
        );
        setSuspendOpen(false);
      } else {
        toast.error(result.error);
      }
    });
  }

  function handlePasswordReset() {
    startTransition(async () => {
      const result = await sendPasswordReset(user.id);
      if (result.success) {
        toast.success("Email de recuperação de senha registrado");
      } else {
        toast.error(result.error);
      }
    });
  }

  function handleImpersonate() {
    startTransition(async () => {
      const result = await impersonateUser(user.id);
      if (result.success) {
        toast.success(`Visualizando como ${user.name ?? user.email}`);
        router.push(result.data.redirectTo);
        router.refresh();
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
        <DropdownMenuContent align="end" className="w-52">
          <DropdownMenuLabel>Ações</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild>
            <Link href={`/admin/users/${user.id}`}>
              <Eye className="mr-2 h-4 w-4" />
              Ver detalhes
            </Link>
          </DropdownMenuItem>
          {canImpersonate && (
            <DropdownMenuItem
              onClick={handleImpersonate}
              disabled={isPending}
            >
              <UserCog className="mr-2 h-4 w-4" />
              Login como este usuário
            </DropdownMenuItem>
          )}
          <DropdownMenuItem
            onClick={handlePasswordReset}
            disabled={isPending}
          >
            <KeyRound className="mr-2 h-4 w-4" />
            Enviar reset de senha
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className={!isActive ? "text-green-600 focus:text-green-600" : "text-yellow-600 focus:text-yellow-600"}
            onClick={() => setSuspendOpen(true)}
            disabled={user.role === "SUPER_ADMIN"}
          >
            {isActive ? (
              <><Ban className="mr-2 h-4 w-4" />Suspender</>
            ) : (
              <><CheckCircle className="mr-2 h-4 w-4" />Reativar</>
            )}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <ConfirmDialog
        open={suspendOpen}
        onOpenChange={setSuspendOpen}
        title={isActive ? "Suspender usuário" : "Reativar usuário"}
        description={
          isActive
            ? `Tem certeza que deseja suspender "${user.name ?? user.email}"?`
            : `Deseja reativar o acesso de "${user.name ?? user.email}"?`
        }
        confirmText={isActive ? "Suspender" : "Reativar"}
        variant={isActive ? "destructive" : "default"}
        onConfirm={handleToggleStatus}
        loading={isPending}
      />
    </>
  );
}
