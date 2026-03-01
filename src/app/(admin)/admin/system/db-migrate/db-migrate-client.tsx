"use client";

import { useState } from "react";
import { runMigrations } from "@/lib/actions/admin/db-migrate";
import type { MigrationStatus, MigrationRunResult } from "@/lib/actions/admin/db-migrate";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle2,
  Clock,
  Database,
  Play,
  AlertTriangle,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";

interface DbMigrateClientProps {
  status: MigrationStatus;
}

export function DbMigrateClient({ status: initialStatus }: DbMigrateClientProps) {
  const [status, setStatus] = useState(initialStatus);
  const [running, setRunning] = useState(false);
  const [lastResult, setLastResult] = useState<MigrationRunResult | null>(null);

  async function handleRunMigrations() {
    setRunning(true);
    setLastResult(null);
    try {
      const result = await runMigrations();
      setLastResult(result);
      if (result.ok) {
        toast.success(
          result.appliedCount === 0
            ? "Nenhuma migration pendente — banco já está atualizado."
            : `${result.appliedCount} migration(s) aplicada(s) com sucesso.`
        );
        // Refresh applied/pending counts optimistically
        if (result.appliedCount > 0) {
          setStatus((prev) => ({
            applied: [...prev.applied, ...prev.pending.slice(0, result.appliedCount)],
            pending: prev.pending.slice(result.appliedCount),
          }));
        }
      } else {
        toast.error("Erro ao aplicar migrations. Veja detalhes abaixo.");
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erro inesperado";
      setLastResult({ ok: false, appliedCount: 0, error: message });
      toast.error("Falha ao executar migrations.");
    } finally {
      setRunning(false);
    }
  }

  const hasPending = status.pending.length > 0;

  return (
    <div className="space-y-6">
      {/* Status cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Aplicadas</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{status.applied.length}</div>
            <p className="text-xs text-muted-foreground">migrations no banco</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pendentes</CardTitle>
            <Clock className={`h-4 w-4 ${hasPending ? "text-yellow-500" : "text-muted-foreground"}`} />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${hasPending ? "text-yellow-600" : ""}`}>
              {status.pending.length}
            </div>
            <p className="text-xs text-muted-foreground">aguardando aplicação</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total no repo</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {status.applied.length + status.pending.length}
            </div>
            <p className="text-xs text-muted-foreground">migrations no código</p>
          </CardContent>
        </Card>
      </div>

      {/* Pending list */}
      {hasPending && (
        <Card className="border-yellow-300 dark:border-yellow-700">
          <CardHeader>
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-yellow-500" />
              Migrations pendentes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1.5">
              {status.pending.map((tag) => (
                <div key={tag} className="flex items-center gap-2 text-sm">
                  <Badge variant="outline" className="font-mono text-xs border-yellow-400 text-yellow-700 dark:text-yellow-400">
                    pendente
                  </Badge>
                  <span className="font-mono">{tag}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Applied list */}
      {status.applied.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              Migrations aplicadas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1.5 max-h-64 overflow-y-auto">
              {status.applied.map((tag) => (
                <div key={tag} className="flex items-center gap-2 text-sm">
                  <Badge variant="outline" className="font-mono text-xs border-green-400 text-green-700 dark:text-green-400">
                    ok
                  </Badge>
                  <span className="font-mono text-muted-foreground">{tag}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Result message */}
      {lastResult && (
        <div
          className={`rounded-lg border px-4 py-3 text-sm ${
            lastResult.ok
              ? "border-green-300 bg-green-50 text-green-800 dark:border-green-700 dark:bg-green-950 dark:text-green-300"
              : "border-red-300 bg-red-50 text-red-800 dark:border-red-700 dark:bg-red-950 dark:text-red-300"
          }`}
        >
          {lastResult.ok
            ? lastResult.appliedCount === 0
              ? "Banco já estava atualizado — nenhuma migration foi aplicada."
              : `${lastResult.appliedCount} migration(s) aplicada(s) com sucesso.`
            : `Erro: ${lastResult.error ?? "Falha desconhecida"}`}
        </div>
      )}

      {/* Action */}
      <div className="flex items-center gap-4">
        <Button
          onClick={handleRunMigrations}
          disabled={running}
          variant={hasPending ? "default" : "outline"}
          className="gap-2"
        >
          {running ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Play className="h-4 w-4" />
          )}
          {running ? "Aplicando..." : "Rodar migrations agora"}
        </Button>
        <p className="text-xs text-muted-foreground">
          Operação idempotente — seguro rodar múltiplas vezes.
        </p>
      </div>
    </div>
  );
}
