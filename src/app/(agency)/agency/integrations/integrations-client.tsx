"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import type { Integration } from "@/lib/db/schema";
import {
  connectAsaas,
  rotateAsaasKey,
  disconnectProvider,
} from "@/lib/actions/agency/integrations";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

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
          toast.success("Chave do Asaas atualizada com sucesso!");
        }
        closeModal();
        router.refresh();
      } catch (e) {
        setFieldError(
          e instanceof Error ? e.message : "Erro ao processar. Tente novamente."
        );
      }
    });
  }

  function handleDisconnect() {
    startTransition(async () => {
      try {
        await disconnectProvider({ provider: "ASAAS" });
        toast.success("Integração Asaas desconectada.");
        closeModal();
        router.refresh();
      } catch (e) {
        setFieldError(
          e instanceof Error ? e.message : "Erro ao desconectar."
        );
      }
    });
  }

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {/* Asaas — active */}
        <AsaasCard
          integration={asaas}
          onConnect={() => open("connect")}
          onRotate={() => open("rotate")}
          onDisconnect={() => open("disconnect")}
          disabled={pending}
        />

        {/* Placeholders */}
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

      {/* Dialog: connect / rotate */}
      <Dialog
        open={mode === "connect" || mode === "rotate"}
        onOpenChange={(open) => !open && closeModal()}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {mode === "connect" ? "Conectar Asaas" : "Trocar chave do Asaas"}
            </DialogTitle>
            <DialogDescription>
              {mode === "connect"
                ? "Insira sua API Key do Asaas. Ela será validada e armazenada com criptografia AES-256."
                : "Insira a nova API Key para substituir a atual. A chave antiga deixará de ser usada."}
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

      {/* Dialog: disconnect */}
      <Dialog
        open={mode === "disconnect"}
        onOpenChange={(open) => !open && closeModal()}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Desconectar Asaas</DialogTitle>
            <DialogDescription>
              A integração será marcada como desconectada. As credenciais
              armazenadas serão mantidas mas não serão utilizadas até uma
              reconexão.
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
      className:
        "bg-green-100 text-green-800 border-green-200 hover:bg-green-100",
    },
    error: { label: "Erro", className: "bg-red-100 text-red-800 border-red-200 hover:bg-red-100" },
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
  disabled,
}: {
  integration: Integration | null;
  onConnect: () => void;
  onRotate: () => void;
  onDisconnect: () => void;
  disabled: boolean;
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
        {isConnected && integration?.accountLabel && (
          <div className="text-sm space-y-1">
            <p>
              <span className="text-muted-foreground">Conta: </span>
              <span className="font-medium">{integration.accountLabel}</span>
            </p>
            {integration.lastSyncedAt && (
              <p>
                <span className="text-muted-foreground">Última sync: </span>
                {new Date(integration.lastSyncedAt).toLocaleDateString(
                  "pt-BR",
                  { day: "2-digit", month: "2-digit", year: "numeric" }
                )}
              </p>
            )}
          </div>
        )}
        {status === "error" && integration?.lastError && (
          <p className="text-sm text-destructive">{integration.lastError}</p>
        )}
        <div className="flex flex-wrap gap-2">
          {!isConnected ? (
            <Button size="sm" onClick={onConnect} disabled={disabled}>
              Conectar
            </Button>
          ) : (
            <>
              <Button
                size="sm"
                variant="outline"
                onClick={onRotate}
                disabled={disabled}
              >
                Trocar chave
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={onDisconnect}
                disabled={disabled}
                className="text-destructive hover:bg-destructive/10"
              >
                Desconectar
              </Button>
            </>
          )}
        </div>
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
