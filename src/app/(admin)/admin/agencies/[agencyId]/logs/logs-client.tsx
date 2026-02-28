"use client";

import { useState, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ChevronLeft, ChevronRight, Search, User } from "lucide-react";
import type { AuditLogEntry } from "@/lib/actions/admin/logs";

const ACTION_OPTIONS = [
  { value: "__all__", label: "Todas as ações" },
  { value: "limit_blocked", label: "limit_blocked" },
  { value: "agency_status_changed", label: "agency_status_changed" },
  { value: "feature_flag.override_set", label: "feature_flag.override_set" },
  { value: "template_changed", label: "template_changed" },
  { value: "agency_entered", label: "agency_entered" },
  { value: "email_sent", label: "email_sent" },
];

const PERIOD_OPTIONS = [
  { value: "all", label: "Todo o período" },
  { value: "7d", label: "Últimos 7 dias" },
  { value: "30d", label: "Últimos 30 dias" },
];

function summarizeLog(action: string, metadata: Record<string, unknown> | null): string {
  const m = metadata ?? {};
  switch (action) {
    case "limit_blocked":
      return `Limite bloqueado: ${String(m.resourceType ?? "—")}`;
    case "agency_status_changed":
      return `Status alterado para: ${String(m.after ?? "—")}`;
    case "feature_flag.override_set":
      return `Override de flag: ${String(m.flagKey ?? "—")}`;
    case "template_changed":
      return `Template atualizado: ${String(m.key ?? "—")}`;
    case "agency_entered":
      return "PO entrou no modo agência";
    case "email_sent":
      return `E-mail enviado: ${String(m.templateKey ?? "—")}`;
    default:
      return action;
  }
}

function actionBadgeVariant(
  action: string
): "default" | "destructive" | "secondary" | "outline" {
  if (action === "limit_blocked") return "destructive";
  if (action.startsWith("agency_status")) return "secondary";
  return "outline";
}

interface LogsClientProps {
  agencyId: string;
  items: AuditLogEntry[];
  totalCount: number;
  page: number;
  totalPages: number;
  currentAction: string;
  currentPeriod: string;
  currentSearch: string;
}

export function LogsClient({
  agencyId,
  items,
  totalCount,
  page,
  totalPages,
  currentAction,
  currentPeriod,
  currentSearch,
}: LogsClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [search, setSearch] = useState(currentSearch);
  const [selectedLog, setSelectedLog] = useState<AuditLogEntry | null>(null);

  const pushParams = useCallback(
    (updates: Record<string, string>) => {
      const params = new URLSearchParams(searchParams.toString());
      for (const [key, val] of Object.entries(updates)) {
        if (val && val !== "__all__" && val !== "all") params.set(key, val);
        else params.delete(key);
      }
      params.delete("page");
      router.push(`/admin/agencies/${agencyId}/logs?${params.toString()}`);
    },
    [router, searchParams, agencyId]
  );

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    pushParams({ search });
  }

  function goToPage(newPage: number) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", String(newPage));
    router.push(`/admin/agencies/${agencyId}/logs?${params.toString()}`);
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-end">
        <div className="w-48">
          <Select
            value={currentAction || "__all__"}
            onValueChange={(val) => pushParams({ action: val })}
          >
            <SelectTrigger className="h-9 text-sm">
              <SelectValue placeholder="Ação" />
            </SelectTrigger>
            <SelectContent>
              {ACTION_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="w-44">
          <Select
            value={currentPeriod || "all"}
            onValueChange={(val) => pushParams({ period: val })}
          >
            <SelectTrigger className="h-9 text-sm">
              <SelectValue placeholder="Período" />
            </SelectTrigger>
            <SelectContent>
              {PERIOD_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <form onSubmit={handleSearch} className="flex gap-2">
          <Input
            className="h-9 w-56 text-sm"
            placeholder="Buscar na ação..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <Button type="submit" variant="outline" size="sm" className="h-9 px-3">
            <Search className="h-4 w-4" />
          </Button>
        </form>

        <span className="text-xs text-muted-foreground ml-auto self-center">
          {totalCount} evento{totalCount !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Timeline */}
      {items.length === 0 ? (
        <div className="border rounded-lg py-12 text-center text-sm text-muted-foreground">
          Nenhum log encontrado para os filtros selecionados.
        </div>
      ) : (
        <div className="border rounded-lg divide-y">
          {items.map((log) => {
            const dateStr = new Date(log.createdAt).toLocaleString("pt-BR", {
              timeZone: "America/Sao_Paulo",
              day: "2-digit",
              month: "2-digit",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            });

            return (
              <div key={log.id} className="flex items-start gap-4 px-4 py-3">
                {/* Date */}
                <div className="w-36 flex-shrink-0 text-xs text-muted-foreground font-mono pt-0.5">
                  {dateStr}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge
                      variant={actionBadgeVariant(log.action)}
                      className="text-[10px] font-mono px-1.5"
                    >
                      {log.action}
                    </Badge>
                    <span className="text-sm text-muted-foreground truncate">
                      {summarizeLog(log.action, log.metadata)}
                    </span>
                  </div>
                  {log.user && (
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <User className="h-3 w-3 flex-shrink-0" />
                      {log.user.name ?? log.user.email ?? log.user.id}
                    </p>
                  )}
                </div>

                {/* Details button */}
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs flex-shrink-0"
                  onClick={() => setSelectedLog(log)}
                >
                  Ver detalhes
                </Button>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => goToPage(page - 1)}
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Anterior
          </Button>
          <span className="text-xs text-muted-foreground">
            Página {page} de {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= totalPages}
            onClick={() => goToPage(page + 1)}
          >
            Próxima
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      )}

      {/* Detail Modal */}
      <Dialog open={!!selectedLog} onOpenChange={(open) => !open && setSelectedLog(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="text-sm font-mono">
              {selectedLog?.action}
            </DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto">
            <pre className="text-xs bg-muted rounded-md p-4 overflow-x-auto whitespace-pre-wrap break-words">
              {JSON.stringify(
                {
                  id: selectedLog?.id,
                  action: selectedLog?.action,
                  entityType: selectedLog?.entityType,
                  entityId: selectedLog?.entityId,
                  ipAddress: selectedLog?.ipAddress,
                  createdAt: selectedLog?.createdAt,
                  user: selectedLog?.user,
                  metadata: selectedLog?.metadata,
                },
                null,
                2
              )}
            </pre>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
