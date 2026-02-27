"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { UserCog, KeyRound, Ban, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/admin/confirm-dialog";
import {
  toggleUserStatus,
  sendPasswordReset,
} from "@/lib/actions/admin/users";
import { impersonateUser } from "@/lib/actions/admin/impersonate";
import type { UserDetail } from "@/lib/actions/admin/users";

interface UserQuickActionsProps {
  user: UserDetail;
}

export function UserQuickActions({ user }: UserQuickActionsProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [suspendOpen, setSuspendOpen] = useState(false);

  const isActive = user.userStatus === "active";
  const canImpersonate = user.role !== "SUPER_ADMIN";

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
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Ações rápidas</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {canImpersonate && (
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={handleImpersonate}
              disabled={isPending}
            >
              <UserCog className="h-4 w-4 mr-2" />
              Login como este usuário
            </Button>
          )}
          <Button
            variant="outline"
            className="w-full justify-start"
            onClick={handlePasswordReset}
            disabled={isPending}
          >
            <KeyRound className="h-4 w-4 mr-2" />
            Enviar reset de senha
          </Button>
          {user.role !== "SUPER_ADMIN" && (
            <Button
              variant="outline"
              className={`w-full justify-start ${
                isActive
                  ? "text-yellow-600 hover:text-yellow-700 border-yellow-200 hover:border-yellow-300"
                  : "text-green-600 hover:text-green-700 border-green-200 hover:border-green-300"
              }`}
              onClick={() => setSuspendOpen(true)}
              disabled={isPending}
            >
              {isActive ? (
                <>
                  <Ban className="h-4 w-4 mr-2" />
                  Suspender usuário
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Reativar usuário
                </>
              )}
            </Button>
          )}
        </CardContent>
      </Card>

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
