"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import {
  FlaskConical,
  RefreshCw,
  CheckCircle2,
  Copy,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { createOrResetDemoData, type QaDemoResult } from "@/lib/actions/admin/qa";

function CredRow({ label, value }: { label: string; value: string }) {
  function copy() {
    navigator.clipboard.writeText(value);
    toast.success(`${label} copiado!`);
  }
  return (
    <div className="flex items-center justify-between gap-4 py-1.5">
      <span className="text-sm text-muted-foreground w-20 shrink-0">{label}</span>
      <code className="flex-1 text-sm font-mono bg-muted px-2 py-0.5 rounded">{value}</code>
      <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={copy}>
        <Copy className="h-3.5 w-3.5" />
      </Button>
    </div>
  );
}

function QuickLink({ href, label }: { href: string; label: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-1.5 text-sm text-primary hover:underline"
    >
      <ExternalLink className="h-3.5 w-3.5" />
      {label}
    </a>
  );
}

export function QaSetupClient() {
  const [result, setResult] = useState<QaDemoResult | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleRun() {
    startTransition(async () => {
      const res = await createOrResetDemoData();
      if (res.success) {
        setResult(res.data);
        toast.success("Dados de demonstração criados/resetados com sucesso!");
      } else {
        toast.error(res.error);
      }
    });
  }

  return (
    <div className="space-y-6">
      {/* Action card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FlaskConical className="h-5 w-5 text-violet-500" />
            Setup de Demonstração
          </CardTitle>
          <CardDescription>
            Cria (ou reseta) todos os dados de QA de forma idempotente. Pode ser
            executado múltiplas vezes sem duplicar registros.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-200">
            <strong>O que será criado:</strong> Agência Demo · Admin (AGENCY_ADMIN) ·
            Cliente Demo LTDA · Usuário portal (CLIENT) · 1 deal · 1 ticket.
          </div>
          <Button onClick={handleRun} disabled={isPending} className="gap-2">
            {isPending ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <FlaskConical className="h-4 w-4" />
            )}
            {isPending ? "Processando..." : "Criar / Resetar dados demo"}
          </Button>
        </CardContent>
      </Card>

      {/* Result card */}
      {result && (
        <Card className="border-green-200 dark:border-green-800">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-green-700 dark:text-green-400">
              <CheckCircle2 className="h-5 w-5" />
              Dados prontos
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            {/* Agency */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="outline">Agência</Badge>
                <span className="text-sm font-medium">{result.agency.name}</span>
                <code className="text-xs text-muted-foreground">/{result.agency.slug}</code>
              </div>
            </div>

            {/* Agency Admin */}
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1">
                Admin da Agência (AGENCY_ADMIN)
              </p>
              <div className="rounded-md border divide-y">
                <CredRow label="E-mail" value={result.agencyAdmin.email} />
                <CredRow label="Senha" value={result.agencyAdmin.password} />
              </div>
            </div>

            {/* Portal user */}
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1">
                Usuário Portal (CLIENT)
              </p>
              <div className="rounded-md border divide-y">
                <CredRow label="E-mail" value={result.portalUser.email} />
                <CredRow label="Senha" value={result.portalUser.password} />
              </div>
            </div>

            {/* Quick links */}
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
                Acesso rápido
              </p>
              <div className="flex flex-wrap gap-4">
                <QuickLink href="/agency/dashboard" label="Painel da Agência" />
                <QuickLink href="/portal/dashboard" label="Portal do Cliente" />
                <QuickLink href="/admin/agencies" label="Agências (PO)" />
                <QuickLink href="/login" label="Login" />
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
