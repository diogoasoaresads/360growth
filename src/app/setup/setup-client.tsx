"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { FlaskConical, RefreshCw, CheckCircle2, Copy, ArrowRight } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { bootstrapDemoData, type SetupResult } from "@/lib/actions/setup";

function CredRow({ label, value }: { label: string; value: string }) {
  function copy() {
    navigator.clipboard.writeText(value);
    toast.success(`${label} copiado!`);
  }
  return (
    <div className="flex items-center justify-between gap-4 py-1.5">
      <span className="text-sm text-muted-foreground w-20 shrink-0">{label}</span>
      <code className="flex-1 text-sm font-mono bg-muted px-2 py-0.5 rounded truncate">{value}</code>
      <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={copy}>
        <Copy className="h-3.5 w-3.5" />
      </Button>
    </div>
  );
}

export function SetupClient() {
  const [result, setResult] = useState<SetupResult | null>(null);
  const [created, setCreated] = useState<string[]>([]);
  const [isPending, startTransition] = useTransition();

  function handleRun() {
    startTransition(async () => {
      const res = await bootstrapDemoData();
      if (res.success) {
        setResult(res.data);
        setCreated(res.created);
        toast.success("Dados inicializados com sucesso!");
      } else {
        toast.error(res.error);
      }
    });
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 p-4">
      <div className="w-full max-w-md space-y-4">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-500/20 border border-violet-400/30 text-violet-300 text-xs">
            <FlaskConical className="h-3.5 w-3.5" />
            Ambiente de Desenvolvimento / QA
          </div>
          <h1 className="text-2xl font-bold text-white">Inicializar Sistema</h1>
          <p className="text-slate-400 text-sm">
            Cria os usuários demo e dados de teste para acesso imediato.
          </p>
        </div>

        {!result ? (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Setup de dados demo</CardTitle>
              <CardDescription>
                Idempotente — pode ser executado múltiplas vezes. Cria ou reseta:
                SUPER_ADMIN · Admin da Agência · Usuário Portal · Agência Demo · Deal · Ticket.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={handleRun} disabled={isPending} className="w-full gap-2">
                {isPending ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <FlaskConical className="h-4 w-4" />
                )}
                {isPending ? "Inicializando..." : "Inicializar dados demo"}
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card className="border-green-500/30">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-green-400 text-base">
                <CheckCircle2 className="h-5 w-5" />
                Pronto!{created.length > 0 && ` (${created.length} criado${created.length > 1 ? "s" : ""})`}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              {/* Super Admin */}
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1">
                  PO / Super Admin
                </p>
                <div className="rounded-md border divide-y">
                  <CredRow label="E-mail" value={result.superAdmin.email} />
                  <CredRow label="Senha" value={result.superAdmin.password} />
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

              {/* Portal User */}
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1">
                  Usuário Portal (CLIENT)
                </p>
                <div className="rounded-md border divide-y">
                  <CredRow label="E-mail" value={result.portalUser.email} />
                  <CredRow label="Senha" value={result.portalUser.password} />
                </div>
              </div>

              {/* Go to login */}
              <Link href="/login">
                <Button className="w-full gap-2">
                  Ir para o Login
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>

              <Button variant="outline" size="sm" className="w-full" onClick={handleRun} disabled={isPending}>
                {isPending ? <RefreshCw className="h-3.5 w-3.5 animate-spin mr-2" /> : null}
                Resetar novamente
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
