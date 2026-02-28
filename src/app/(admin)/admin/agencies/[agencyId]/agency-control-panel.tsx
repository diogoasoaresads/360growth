"use client";

import { useTransition, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LogIn, ShieldOff, ShieldCheck, Loader2 } from "lucide-react";
import { enterAgencyMode, setAgencyStatus } from "@/lib/actions/admin/agency-control";
import type { AgencyStatus } from "@/lib/db/schema";

const STATUS_LABELS: Record<string, string> = {
  active: "Ativa",
  trial: "Trial",
  suspended: "Suspensa",
  blocked: "Bloqueada",
  past_due: "Inadimplente",
  cancelled: "Cancelada",
  deleted: "Deletada",
};

const STATUS_VARIANTS: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  active: "default",
  trial: "secondary",
  suspended: "outline",
  blocked: "destructive",
  past_due: "destructive",
  cancelled: "outline",
  deleted: "outline",
};

interface AgencyControlPanelProps {
  agencyId: string;
  agencyStatus: AgencyStatus;
  planName: string | null;
  globalFlagsCount: number;
  overridesCount: number;
}

export function AgencyControlPanel({
  agencyId,
  agencyStatus,
  planName,
  globalFlagsCount,
  overridesCount,
}: AgencyControlPanelProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  function showMessage(type: "success" | "error", text: string) {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 4000);
  }

  function handleEnterAgencyMode() {
    startTransition(async () => {
      const result = await enterAgencyMode(agencyId);
      if (result.success) {
        router.push(result.data.redirectTo);
      } else {
        showMessage("error", result.error);
      }
    });
  }

  function handleToggleBlock() {
    const newStatus: AgencyStatus = agencyStatus === "blocked" ? "active" : "blocked";
    startTransition(async () => {
      const result = await setAgencyStatus(agencyId, newStatus);
      if (result.success) {
        showMessage(
          "success",
          newStatus === "blocked" ? "Agência bloqueada." : "Agência desbloqueada."
        );
        router.refresh();
      } else {
        showMessage("error", result.error);
      }
    });
  }

  const isBlocked = agencyStatus === "blocked";

  return (
    <Card>
      <CardHeader>
        <CardTitle>Controle da Agência</CardTitle>
        <CardDescription>Ações administrativas e visão geral do contexto.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">

        {/* Info grid */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 text-sm">
          <div className="space-y-1">
            <p className="text-muted-foreground text-xs uppercase tracking-wide">Plano</p>
            <p className="font-medium">{planName ?? "Sem plano"}</p>
          </div>
          <div className="space-y-1">
            <p className="text-muted-foreground text-xs uppercase tracking-wide">Status</p>
            <Badge variant={STATUS_VARIANTS[agencyStatus] ?? "outline"}>
              {STATUS_LABELS[agencyStatus] ?? agencyStatus}
            </Badge>
          </div>
          <div className="space-y-1">
            <p className="text-muted-foreground text-xs uppercase tracking-wide">Feature Flags</p>
            <p className="font-medium">
              {globalFlagsCount} globais · {overridesCount} overrides
            </p>
          </div>
        </div>

        {/* Feedback */}
        {message && (
          <p
            className={`text-sm rounded-md px-3 py-2 ${
              message.type === "success"
                ? "bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400"
                : "bg-destructive/10 text-destructive"
            }`}
          >
            {message.text}
          </p>
        )}

        {/* Actions */}
        <div className="flex flex-wrap gap-3">
          <Button onClick={handleEnterAgencyMode} disabled={isPending}>
            {isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <LogIn className="mr-2 h-4 w-4" />
            )}
            Entrar no modo agência
          </Button>

          <Button
            variant={isBlocked ? "outline" : "destructive"}
            onClick={handleToggleBlock}
            disabled={isPending}
          >
            {isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : isBlocked ? (
              <ShieldCheck className="mr-2 h-4 w-4" />
            ) : (
              <ShieldOff className="mr-2 h-4 w-4" />
            )}
            {isBlocked ? "Desbloquear" : "Bloquear"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
