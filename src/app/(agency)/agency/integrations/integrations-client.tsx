"use client";

import { useState, useEffect, useTransition } from "react";
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
import {
  googleAdsListAccounts,
  googleAdsSelectAccount,
  googleAdsDisconnect,
} from "@/lib/actions/common/google-ads";
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
  Search,
} from "lucide-react";

type AsaasModal = "connect" | "rotate" | "disconnect" | null;

const OAUTH_ERROR_MESSAGES: Record<string, string> = {
  access_denied: "Acesso negado pelo Google. Tente novamente.",
  no_refresh_token:
    "Nenhum refresh_token recebido. Remova o acesso em myaccount.google.com > Segurança > Aplicativos e conecte novamente.",
  token_exchange_failed: "Falha ao trocar código OAuth. Tente novamente.",
  invalid_state: "Estado OAuth inválido ou expirado. Tente novamente.",
  session_mismatch: "Sessão incompatível. Faça login novamente.",
  config_missing: "Configuração OAuth incompleta no servidor.",
  no_agency_context: "Selecione uma agência antes de conectar o Google Ads.",
};

interface Props {
  integrations: Integration[];
  connected?: string;
  oauthError?: string;
}

export function IntegrationsClient({
  integrations: intList,
  connected,
  oauthError,
}: Props) {
  const router = useRouter();
  const [asaasPending, startAsaasTransition] = useTransition();

  // ── Asaas modal ───────────────────────────────────────────────────────────────
  const [asaasMode, setAsaasMode] = useState<AsaasModal>(null);
  const [apiKey, setApiKey] = useState("");
  const [asaasError, setAsaasError] = useState<string | null>(null);

  // ── Test/Sync per-integration loading ────────────────────────────────────────
  const [runningAction, setRunningAction] = useState<{
    integrationId: string;
    action: "test" | "sync";
  } | null>(null);

  // ── Google Ads ────────────────────────────────────────────────────────────────
  const [gadsSelectOpen, setGadsSelectOpen] = useState(false);
  const [gadsAccounts, setGadsAccounts] = useState<
    { customerId: string; label: string }[]
  >([]);
  const [gadsAccountsLoading, setGadsAccountsLoading] = useState(false);
  const [gadsAccountSearch, setGadsAccountSearch] = useState("");
  const [gadsDisconnectOpen, setGadsDisconnectOpen] = useState(false);
  const [gadsDisconnectPending, startGadsDisconnect] = useTransition();

  // ── Jobs drawer ───────────────────────────────────────────────────────────────
  const [jobsDrawer, setJobsDrawer] = useState<{
    integrationId: string;
    label: string;
  } | null>(null);
  const [jobs, setJobs] = useState<IntegrationJob[]>([]);
  const [jobsLoading, setJobsLoading] = useState(false);

  const asaas = intList.find((i) => i.provider === "ASAAS") ?? null;
  const googleAds = intList.find((i) => i.provider === "GOOGLE_ADS") ?? null;

  // Show toast after OAuth redirect (runs once on mount)
  useEffect(() => {
    if (connected === "google_ads") {
      toast.success(
        "Google Ads conectado! Clique em 'Selecionar conta' para configurar."
      );
    }
    if (oauthError) {
      const msg =
        OAUTH_ERROR_MESSAGES[oauthError] ?? `Erro OAuth: ${oauthError}`;
      toast.error(msg, { duration: 8000 });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Asaas helpers ─────────────────────────────────────────────────────────────
  function openAsaas(m: AsaasModal) {
    setAsaasMode(m);
    setApiKey("");
    setAsaasError(null);
  }
  function closeAsaas() {
    setAsaasMode(null);
    setApiKey("");
    setAsaasError(null);
  }
  function handleAsaasSubmit() {
    if (!apiKey.trim()) {
      setAsaasError("Informe a API Key.");
      return;
    }
    startAsaasTransition(async () => {
      try {
        if (asaasMode === "connect") {
          await connectAsaas({ apiKey: apiKey.trim() });
          toast.success("Asaas conectado com sucesso!");
        } else if (asaasMode === "rotate") {
          await rotateAsaasKey({ apiKey: apiKey.trim() });
          toast.success("Chave do Asaas atualizada!");
        }
        closeAsaas();
        router.refresh();
      } catch (e) {
        setAsaasError(e instanceof Error ? e.message : "Erro ao processar.");
      }
    });
  }
  function handleAsaasDisconnect() {
    startAsaasTransition(async () => {
      try {
        await disconnectProvider({ provider: "ASAAS" });
        toast.success("Integração Asaas desconectada.");
        closeAsaas();
        router.refresh();
      } catch (e) {
        setAsaasError(e instanceof Error ? e.message : "Erro ao desconectar.");
      }
    });
  }

  // ── Test / Sync ───────────────────────────────────────────────────────────────
  async function handleRun(integrationId: string, action: "test" | "sync") {
    if (runningAction) return;
    setRunningAction({ integrationId, action });
    try {
      const r = await runIntegrationAction({ integrationId, action });
      if (r.ok) toast.success(r.message ?? `${action} concluído!`);
      else toast.error(r.message ?? `${action} falhou.`);
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : `Erro ao ${action}.`);
    } finally {
      setRunningAction(null);
    }
  }

  // ── Jobs drawer ───────────────────────────────────────────────────────────────
  async function handleOpenJobs(integrationId: string, label: string) {
    setJobsDrawer({ integrationId, label });
    setJobsLoading(true);
    try {
      const result = await listJobs({ integrationId, limit: 10 });
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
      if (jobsDrawer?.integrationId) {
        const updated = await listJobs({
          integrationId: jobsDrawer.integrationId,
          limit: 10,
        });
        setJobs(updated);
      }
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao reexecutar.");
    }
  }

  // ── Google Ads ────────────────────────────────────────────────────────────────
  async function handleGadsOpenSelect() {
    setGadsSelectOpen(true);
    setGadsAccountSearch("");
    setGadsAccountsLoading(true);
    try {
      const accounts = await googleAdsListAccounts();
      setGadsAccounts(accounts);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao listar contas.");
      setGadsSelectOpen(false);
    } finally {
      setGadsAccountsLoading(false);
    }
  }

  async function handleGadsSelectAccount(customerId: string) {
    try {
      await googleAdsSelectAccount({ customerId });
      toast.success(`Conta Google Ads ${customerId} selecionada.`);
      setGadsSelectOpen(false);
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao selecionar conta.");
    }
  }

  function handleGadsDisconnect() {
    startGadsDisconnect(async () => {
      try {
        await googleAdsDisconnect();
        toast.success("Google Ads desconectado.");
        setGadsDisconnectOpen(false);
        router.refresh();
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Erro ao desconectar.");
      }
    });
  }

  const isRunning = (id: string, action: "test" | "sync") =>
    runningAction?.integrationId === id && runningAction?.action === action;
  const anyBusy = !!runningAction;

  const filteredAccounts = gadsAccounts.filter(
    (a) =>
      !gadsAccountSearch ||
      a.customerId.includes(gadsAccountSearch) ||
      a.label.toLowerCase().includes(gadsAccountSearch.toLowerCase())
  );

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <AsaasCard
          integration={asaas}
          onConnect={() => openAsaas("connect")}
          onRotate={() => openAsaas("rotate")}
          onDisconnect={() => openAsaas("disconnect")}
          onTest={() => asaas?.id && handleRun(asaas.id, "test")}
          onSync={() => asaas?.id && handleRun(asaas.id, "sync")}
          onViewJobs={() => asaas?.id && handleOpenJobs(asaas.id, "Asaas")}
          testLoading={!!asaas?.id && isRunning(asaas.id, "test")}
          syncLoading={!!asaas?.id && isRunning(asaas.id, "sync")}
          anyBusy={anyBusy || asaasPending}
        />
        <GoogleAdsCard
          integration={googleAds}
          onConnect={() => (window.location.href = "/api/oauth/google/start")}
          onSelectAccount={handleGadsOpenSelect}
          onDisconnect={() => setGadsDisconnectOpen(true)}
          onTest={() => googleAds?.id && handleRun(googleAds.id, "test")}
          onSync={() => googleAds?.id && handleRun(googleAds.id, "sync")}
          onViewJobs={() =>
            googleAds?.id && handleOpenJobs(googleAds.id, "Google Ads")
          }
          testLoading={!!googleAds?.id && isRunning(googleAds.id, "test")}
          syncLoading={!!googleAds?.id && isRunning(googleAds.id, "sync")}
          anyBusy={anyBusy}
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

      {/* ── Jobs Sheet ──────────────────────────────────────────────────────── */}
      <Sheet
        open={!!jobsDrawer}
        onOpenChange={(o) => !o && setJobsDrawer(null)}
      >
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Jobs — {jobsDrawer?.label}</SheetTitle>
            <SheetDescription>
              Últimos 10 jobs desta integração
            </SheetDescription>
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

      {/* ── Asaas Connect / Rotate ──────────────────────────────────────────── */}
      <Dialog
        open={asaasMode === "connect" || asaasMode === "rotate"}
        onOpenChange={(o) => !o && closeAsaas()}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {asaasMode === "connect"
                ? "Conectar Asaas"
                : "Trocar chave do Asaas"}
            </DialogTitle>
            <DialogDescription>
              {asaasMode === "connect"
                ? "Insira sua API Key. Ela será validada e armazenada com criptografia AES-256."
                : "Insira a nova API Key para substituir a atual."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-1.5">
            <Label htmlFor="asaasApiKey">API Key</Label>
            <Input
              id="asaasApiKey"
              type="password"
              value={apiKey}
              onChange={(e) => {
                setApiKey(e.target.value);
                setAsaasError(null);
              }}
              onKeyDown={(e) => e.key === "Enter" && handleAsaasSubmit()}
              placeholder="$aact_..."
              disabled={asaasPending}
              autoComplete="off"
              autoFocus
            />
            {asaasError && (
              <p className="text-sm text-destructive">{asaasError}</p>
            )}
            <p className="text-xs text-muted-foreground">
              A chave nunca é exibida após ser salva.
            </p>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={closeAsaas}
              disabled={asaasPending}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleAsaasSubmit}
              disabled={asaasPending || !apiKey.trim()}
            >
              {asaasPending
                ? "Validando..."
                : asaasMode === "connect"
                  ? "Validar e Conectar"
                  : "Trocar chave"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Asaas Disconnect ────────────────────────────────────────────────── */}
      <Dialog
        open={asaasMode === "disconnect"}
        onOpenChange={(o) => !o && closeAsaas()}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Desconectar Asaas</DialogTitle>
            <DialogDescription>
              A integração será marcada como desconectada. As credenciais são
              mantidas mas não serão usadas até uma reconexão.
            </DialogDescription>
          </DialogHeader>
          {asaasError && (
            <p className="text-sm text-destructive">{asaasError}</p>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={closeAsaas}
              disabled={asaasPending}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleAsaasDisconnect}
              disabled={asaasPending}
            >
              {asaasPending ? "Desconectando..." : "Desconectar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Google Ads: Selecionar conta ────────────────────────────────────── */}
      <Dialog open={gadsSelectOpen} onOpenChange={setGadsSelectOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Selecionar conta Google Ads</DialogTitle>
            <DialogDescription>
              Escolha a conta (Customer ID) que será usada para sincronizar
              campanhas.
            </DialogDescription>
          </DialogHeader>
          {gadsAccountsLoading ? (
            <div className="flex items-center justify-center py-8 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin mr-2" />
              Carregando contas...
            </div>
          ) : (
            <div className="space-y-3">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por ID ou nome..."
                  value={gadsAccountSearch}
                  onChange={(e) => setGadsAccountSearch(e.target.value)}
                  className="pl-8"
                  autoFocus
                />
              </div>
              <div className="max-h-60 overflow-y-auto space-y-1 rounded-md border p-1">
                {filteredAccounts.length === 0 ? (
                  <p className="text-center text-sm text-muted-foreground py-6">
                    {gadsAccounts.length === 0
                      ? "Nenhuma conta acessível encontrada."
                      : "Nenhuma conta corresponde à busca."}
                  </p>
                ) : (
                  filteredAccounts.map((acc) => (
                    <button
                      key={acc.customerId}
                      onClick={() => handleGadsSelectAccount(acc.customerId)}
                      className="w-full text-left rounded px-3 py-2 text-sm hover:bg-accent transition-colors"
                    >
                      <span className="font-mono text-xs text-muted-foreground mr-2">
                        {acc.customerId}
                      </span>
                      {acc.label}
                    </button>
                  ))
                )}
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setGadsSelectOpen(false)}
              disabled={gadsAccountsLoading}
            >
              Cancelar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Google Ads: Desconectar ──────────────────────────────────────────── */}
      <Dialog open={gadsDisconnectOpen} onOpenChange={setGadsDisconnectOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Desconectar Google Ads</DialogTitle>
            <DialogDescription>
              A integração será marcada como desconectada e a conta selecionada
              será removida. As credenciais OAuth são mantidas no banco.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setGadsDisconnectOpen(false)}
              disabled={gadsDisconnectPending}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleGadsDisconnect}
              disabled={gadsDisconnectPending}
            >
              {gadsDisconnectPending ? "Desconectando..." : "Desconectar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

// ─── Sub-components ────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; className: string }> = {
    connected: {
      label: "Conectado",
      className:
        "bg-green-100 text-green-800 border-green-200 hover:bg-green-100",
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
      className:
        "bg-gray-100 text-gray-600 border-gray-200 hover:bg-gray-100",
    },
  };
  const cfg = map[status] ?? map["disconnected"]!;
  return (
    <Badge variant="outline" className={cfg.className}>
      {cfg.label}
    </Badge>
  );
}

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

function AsaasCard({
  integration,
  onConnect,
  onRotate,
  onDisconnect,
  onTest,
  onSync,
  onViewJobs,
  testLoading,
  syncLoading,
  anyBusy,
}: {
  integration: Integration | null;
  onConnect: () => void;
  onRotate: () => void;
  onDisconnect: () => void;
  onTest: () => void;
  onSync: () => void;
  onViewJobs: () => void;
  testLoading: boolean;
  syncLoading: boolean;
  anyBusy: boolean;
}) {
  const status = integration?.status ?? "disconnected";
  const isConnected = status === "connected";
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
                Conta:{" "}
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
        {!isConnected ? (
          <Button
            size="sm"
            onClick={onConnect}
            disabled={anyBusy}
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
                disabled={anyBusy}
                className="flex-1"
              >
                {testLoading && (
                  <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />
                )}
                Testar
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={onSync}
                disabled={anyBusy}
                className="flex-1"
              >
                {syncLoading && (
                  <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />
                )}
                Sincronizar
              </Button>
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={onRotate}
                disabled={anyBusy}
                className="flex-1 text-xs"
              >
                Trocar chave
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={onDisconnect}
                disabled={anyBusy}
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
          disabled={anyBusy}
          className="w-full text-xs text-muted-foreground"
        >
          Ver Jobs
        </Button>
      </CardContent>
    </Card>
  );
}

function GoogleAdsCard({
  integration,
  onConnect,
  onSelectAccount,
  onDisconnect,
  onTest,
  onSync,
  onViewJobs,
  testLoading,
  syncLoading,
  anyBusy,
}: {
  integration: Integration | null;
  onConnect: () => void;
  onSelectAccount: () => void;
  onDisconnect: () => void;
  onTest: () => void;
  onSync: () => void;
  onViewJobs: () => void;
  testLoading: boolean;
  syncLoading: boolean;
  anyBusy: boolean;
}) {
  const status = integration?.status ?? "disconnected";
  const isConnected = status === "connected";
  const hasAccount = isConnected && !!integration?.externalAccountId;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold">Google Ads</CardTitle>
          <StatusBadge status={status} />
        </div>
        <CardDescription>
          Gerencie campanhas e anúncios do Google
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {isConnected && (
          <div className="text-sm space-y-1 text-muted-foreground">
            {hasAccount ? (
              <p>
                Conta:{" "}
                <span className="font-mono text-xs text-foreground font-medium">
                  {integration?.externalAccountId}
                </span>
              </p>
            ) : (
              <p className="text-amber-600 text-xs">
                Conectado. Selecione uma conta para sincronizar.
              </p>
            )}
            {hasAccount && (
              <>
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
              </>
            )}
          </div>
        )}
        {status === "error" && integration?.lastError && (
          <p className="text-sm text-destructive">{integration.lastError}</p>
        )}
        {!isConnected ? (
          <Button
            size="sm"
            onClick={onConnect}
            disabled={anyBusy}
            className="w-full"
          >
            Conectar via Google
          </Button>
        ) : (
          <div className="space-y-2">
            <Button
              size="sm"
              variant={hasAccount ? "outline" : "default"}
              onClick={onSelectAccount}
              disabled={anyBusy}
              className="w-full"
            >
              {hasAccount ? "Trocar conta" : "Selecionar conta"}
            </Button>
            {hasAccount ? (
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={onTest}
                  disabled={anyBusy}
                  className="flex-1"
                >
                  {testLoading && (
                    <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />
                  )}
                  Testar
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={onSync}
                  disabled={anyBusy}
                  className="flex-1"
                >
                  {syncLoading && (
                    <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />
                  )}
                  Sincronizar
                </Button>
              </div>
            ) : (
              <Button
                size="sm"
                variant="outline"
                onClick={onTest}
                disabled={anyBusy}
                className="w-full"
              >
                {testLoading && (
                  <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />
                )}
                Testar conexão
              </Button>
            )}
            <Button
              size="sm"
              variant="outline"
              onClick={onDisconnect}
              disabled={anyBusy}
              className="w-full text-xs text-destructive hover:bg-destructive/10"
            >
              Desconectar
            </Button>
          </div>
        )}
        {isConnected && (
          <>
            <Separator />
            <Button
              size="sm"
              variant="ghost"
              onClick={onViewJobs}
              disabled={anyBusy}
              className="w-full text-xs text-muted-foreground"
            >
              Ver Jobs
            </Button>
          </>
        )}
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
