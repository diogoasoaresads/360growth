"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import type { Integration, IntegrationJob } from "@/lib/db/schema";
import {
  connectAsaas,
  rotateAsaasKey,
  disconnectProvider,
} from "@/lib/actions/agency/integrations";
import {
  runIntegrationAction,
  listJobs,
  runJobNow,
} from "@/lib/actions/common/integration-jobs";
import { formatDuration } from "@/lib/integrations/jobs/engine";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  CheckCircle2,
  XCircle,
  Clock,
  Loader2,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

type ModalMode = "connect" | "rotate" | "disconnect" | null;

interface Props {
  integrations: Integration[];
}

export function IntegrationsClient({ integrations }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [mode, setMode] = useState<ModalMode>(null);
  const [apiKey, setApiKey] = useState("");
  const [fieldError, setFieldError] = useState<string | null>(null);

  // Test / Sync independent loading
  const [pendingAction, setPendingAction] = useState<"test" | "sync" | null>(
    null
  );

  // Jobs drawer
  const [jobsOpen, setJobsOpen] = useState(false);
  const [jobs, setJobs] = useState<IntegrationJob[]>([]);
  const [jobsLoading, setJobsLoading] = useState(false);

  const asaas = integrations.find((i) => i.provider === "ASAAS") ?? null;

  function open(m: ModalMode) {
    setMode(m);
    setApiKey("");
    setFieldError(null);
  }

  function closeModal() {
    setMode(null);
    setApiKey("");
    setFieldError(null);
  }

  // ── Connect / Rotate ────────────────────────────────────────────────────────
  function handleApiKeySubmit() {
    if (!apiKey.trim()) {
      setFieldError("Informe a API Key.");
      return;
    }
    startTransition(async () => {
      try {
        if (mode === "connect") {
          await connectAsaas({ apiKey: apiKey.trim() });
          toast.success("Asaas conectado com sucesso!");
        } else if (mode === "rotate") {
          await rotateAsaasKey({ apiKey: apiKey.trim() });
          toast.success("Chave do Asaas atualizada!");
        }
        closeModal();
        router.refresh();
      } catch (e) {
        setFieldError(e instanceof Error ? e.message : "Erro ao processar.");
      }
    });
  }

  // ── Disconnect ───────────────────────────────────────────────────────────────
  function handleDisconnect() {
    startTransition(async () => {
      try {
        await disconnectProvider({ provider: "ASAAS" });
        toast.success("Integração Asaas desconectada.");
        closeModal();
        router.refresh();
      } catch (e) {
        setFieldError(e instanceof Error ? e.message : "Erro ao desconectar.");
      }
    });
  }

  // ── Test ────────────────────────────────────────────────────────────────────
  async function handleTest() {
    if (!asaas?.id || pendingAction) return;
    setPendingAction("test");
    try {
      const r = await runIntegrationAction({
        integrationId: asaas.id,
        action: "test",
      });
      if (r.ok) toast.success(r.message ?? "Teste concluído com sucesso!");
      else toast.error(r.message ?? "Teste falhou.");
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao testar.");
    } finally {
      setPendingAction(null);
    }
  }

  // ── Sync ─────────────────────────────────────────────────────────────────────
  async function handleSync() {
    if (!asaas?.id || pendingAction) return;
    setPendingAction("sync");
    try {
      const r = await runIntegrationAction({
        integrationId: asaas.id,
        action: "sync",
      });
      if (r.ok) toast.success(r.message ?? "Sincronização concluída!");
      else toast.error(r.message ?? "Sincronização falhou.");
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao sincronizar.");
    } finally {
      setPendingAction(null);
    }
  }

  // ── Jobs drawer ──────────────────────────────────────────────────────────────
  async function handleOpenJobs() {
    setJobsOpen(true);
    if (!asaas?.id) return;
    setJobsLoading(true);
    try {
      const result = await listJobs({ integrationId: asaas.id, limit: 10 });
      setJobs(result);
    } catch {
      toast.error("Erro ao carregar jobs.");
    } finally {
      setJobsLoading(false);
    }
  }

  async function handleRerun(jobId: string) {
    try {
      const r = await runJobNow({ jobId });
      toast[r.ok ? "success" : "error"](r.message);
      // reload jobs list
      if (asaas?.id) {
        const updated = await listJobs({ integrationId: asaas.id, limit: 10 });
        setJobs(updated);
      }
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao reexecutar.");
    }
  }

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <AsaasCard
          integration={asaas}
          onConnect={() => open("connect")}
          onRotate={() => open("rotate")}
          onDisconnect={() => open("disconnect")}
          onTest={handleTest}
          onSync={handleSync}
          onViewJobs={handleOpenJobs}
          pendingAction={pendingAction}
          pendingModal={pending}
        />
        <PlaceholderCard
          name="Google Ads"
          description="Gerencie campanhas e anúncios do Google"
        />
        <PlaceholderCard
          name="Meta Ads"
          description="Gerencie campanhas no Facebook e Instagram"
        />
        <PlaceholderCard
          name="Google Analytics 4"
          description="Acesse dados de tráfego e conversões"
        />
      </div>

      {/* ── Jobs Sheet ─────────────────────────────────────────────────────────── */}
      <Sheet open={jobsOpen} onOpenChange={setJobsOpen}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Jobs — Asaas</SheetTitle>
            <SheetDescription>Últimos 10 jobs desta integração</SheetDescription>
          </SheetHeader>
          <div className="mt-6">
            {jobsLoading ? (
              <div className="flex items-center justify-center py-12 text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin mr-2" />
                Carregando...
              </div>
            ) : jobs.length === 0 ? (
              <p className="text-center text-sm text-muted-foreground py-12">
                Nenhum job executado ainda.
              </p>
            ) : (
              <div className="space-y-3">
                {jobs.map((job) => (
                  <JobRow key={job.id} job={job} onRerun={handleRerun} />
                ))}
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>

      {/* ── Connect / Rotate Dialog ─────────────────────────────────────────────── */}
      <Dialog
        open={mode === "connect" || mode === "rotate"}
        onOpenChange={(o) => !o && closeModal()}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {mode === "connect" ? "Conectar Asaas" : "Trocar chave do Asaas"}
            </DialogTitle>
            <DialogDescription>
              {mode === "connect"
                ? "Insira sua API Key. Ela será validada e armazenada com criptografia AES-256."
                : "Insira a nova API Key para substituir a atual."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="apiKey">API Key</Label>
              <Input
                id="apiKey"
                type="password"
                value={apiKey}
                onChange={(e) => {
                  setApiKey(e.target.value);
                  setFieldError(null);
                }}
                onKeyDown={(e) => e.key === "Enter" && handleApiKeySubmit()}
                placeholder="$aact_..."
                disabled={pending}
                autoComplete="off"
                autoFocus
              />
              {fieldError && (
                <p className="text-sm text-destructive">{fieldError}</p>
              )}
              <p className="text-xs text-muted-foreground">
                A chave nunca é exibida após ser salva.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeModal} disabled={pending}>
              Cancelar
            </Button>
            <Button
              onClick={handleApiKeySubmit}
              disabled={pending || !apiKey.trim()}
            >
              {pending
                ? "Validando..."
                : mode === "connect"
                  ? "Validar e Conectar"
                  : "Trocar chave"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Disconnect Dialog ──────────────────────────────────────────────────── */}
      <Dialog
        open={mode === "disconnect"}
        onOpenChange={(o) => !o && closeModal()}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Desconectar Asaas</DialogTitle>
            <DialogDescription>
              A integração será marcada como desconectada. As credenciais são
              mantidas mas não serão usadas até uma reconexão.
            </DialogDescription>
          </DialogHeader>
          {fieldError && (
            <p className="text-sm text-destructive">{fieldError}</p>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={closeModal} disabled={pending}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleDisconnect}
              disabled={pending}
            >
              {pending ? "Desconectando..." : "Desconectar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; className: string }> = {
    connected: {
      label: "Conectado",
      className: "bg-green-100 text-green-800 border-green-200 hover:bg-green-100",
    },
    error: {
      label: "Erro",
      className: "bg-red-100 text-red-800 border-red-200 hover:bg-red-100",
    },
    expired: {
      label: "Expirado",
      className:
        "bg-yellow-100 text-yellow-800 border-yellow-200 hover:bg-yellow-100",
    },
    revoked: {
      label: "Revogado",
      className: "bg-red-100 text-red-800 border-red-200 hover:bg-red-100",
    },
    disconnected: {
      label: "Desconectado",
      className: "bg-gray-100 text-gray-600 border-gray-200 hover:bg-gray-100",
    },
  };
  const cfg = map[status] ?? map["disconnected"]!;
  return (
    <Badge variant="outline" className={cfg.className}>
      {cfg.label}
    </Badge>
  );
}

function AsaasCard({
  integration,
  onConnect,
  onRotate,
  onDisconnect,
  onTest,
  onSync,
  onViewJobs,
  pendingAction,
  pendingModal,
}: {
  integration: Integration | null;
  onConnect: () => void;
  onRotate: () => void;
  onDisconnect: () => void;
  onTest: () => void;
  onSync: () => void;
  onViewJobs: () => void;
  pendingAction: "test" | "sync" | null;
  pendingModal: boolean;
}) {
  const status = integration?.status ?? "disconnected";
  const isConnected = status === "connected";
  const isAnyBusy = !!pendingAction || pendingModal;

  function fmt(d: Date | null | undefined): string {
    if (!d) return "—";
    return new Date(d).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold">Asaas</CardTitle>
          <StatusBadge status={status} />
        </div>
        <CardDescription>Pagamentos e cobranças recorrentes</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {isConnected && (
          <div className="text-sm space-y-1 text-muted-foreground">
            {integration?.accountLabel && (
              <p>
                <span>Conta: </span>
                <span className="text-foreground font-medium">
                  {integration.accountLabel}
                </span>
              </p>
            )}
            <p>
              Último teste:{" "}
              <span className="text-foreground">
                {fmt(integration?.lastTestedAt)}
              </span>
            </p>
            <p>
              Última sync:{" "}
              <span className="text-foreground">
                {fmt(integration?.lastSyncedAt)}
              </span>
            </p>
          </div>
        )}
        {status === "error" && integration?.lastError && (
          <p className="text-sm text-destructive">{integration.lastError}</p>
        )}

        {/* Primary actions */}
        {!isConnected ? (
          <Button
            size="sm"
            onClick={onConnect}
            disabled={isAnyBusy}
            className="w-full"
          >
            Conectar
          </Button>
        ) : (
          <div className="space-y-2">
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={onTest}
                disabled={isAnyBusy}
                className="flex-1"
              >
                {pendingAction === "test" ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />
                ) : null}
                Testar
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={onSync}
                disabled={isAnyBusy}
                className="flex-1"
              >
                {pendingAction === "sync" ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />
                ) : null}
                Sincronizar
              </Button>
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={onRotate}
                disabled={isAnyBusy}
                className="flex-1 text-xs"
              >
                Trocar chave
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={onDisconnect}
                disabled={isAnyBusy}
                className="flex-1 text-xs text-destructive hover:bg-destructive/10"
              >
                Desconectar
              </Button>
            </div>
          </div>
        )}

        <Separator />
        <Button
          size="sm"
          variant="ghost"
          onClick={onViewJobs}
          disabled={isAnyBusy}
          className="w-full text-xs text-muted-foreground"
        >
          Ver Jobs
        </Button>
      </CardContent>
    </Card>
  );
}

function PlaceholderCard({
  name,
  description,
}: {
  name: string;
  description: string;
}) {
  return (
    <Card className="opacity-55">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold">{name}</CardTitle>
          <Badge variant="secondary">Em breve</Badge>
        </div>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <Button size="sm" disabled>
          Em breve
        </Button>
      </CardContent>
    </Card>
  );
}

function JobStatusIcon({ status }: { status: string }) {
  switch (status) {
    case "success":
      return <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0" />;
    case "failed":
      return <XCircle className="h-4 w-4 text-red-600 flex-shrink-0" />;
    case "running":
      return (
        <Loader2 className="h-4 w-4 text-blue-600 animate-spin flex-shrink-0" />
      );
    default:
      return <Clock className="h-4 w-4 text-gray-400 flex-shrink-0" />;
  }
}

function JobRow({
  job,
  onRerun,
}: {
  job: IntegrationJob;
  onRerun: (id: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);

  const durationMs =
    job.startedAt && job.finishedAt
      ? job.finishedAt.getTime() - job.startedAt.getTime()
      : null;

  const typeLabels: Record<string, string> = {
    test: "Teste",
    sync: "Sync",
    health_check: "Health",
    custom: "Custom",
  };

  return (
    <div className="rounded-lg border p-3 space-y-2">
      <div className="flex items-center gap-2">
        <JobStatusIcon status={job.status} />
        <span className="text-xs font-medium">
          {typeLabels[job.type] ?? job.type}
        </span>
        <span className="text-xs text-muted-foreground ml-auto">
          {new Date(job.createdAt).toLocaleString("pt-BR", {
            day: "2-digit",
            month: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
          })}
        </span>
        {durationMs !== null && (
          <span className="text-xs text-muted-foreground">
            {formatDuration(durationMs)}
          </span>
        )}
      </div>

      {job.lastError && (
        <div>
          <button
            onClick={() => setExpanded((v) => !v)}
            className="flex items-center gap-1 text-xs text-destructive hover:underline"
          >
            {expanded ? (
              <ChevronUp className="h-3 w-3" />
            ) : (
              <ChevronDown className="h-3 w-3" />
            )}
            Ver erro
          </button>
          {expanded && (
            <p className="mt-1 text-xs text-muted-foreground break-all">
              {job.lastError}
            </p>
          )}
        </div>
      )}

      {(job.status === "failed" || job.status === "success") && (
        <Button
          size="sm"
          variant="ghost"
          onClick={() => onRerun(job.id)}
          className="h-6 text-xs px-2"
        >
          Reexecutar
        </Button>
      )}
    </div>
  );
}
