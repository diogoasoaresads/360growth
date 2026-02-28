"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { KeyRound, UserX, Globe, Copy, CheckCircle } from "lucide-react";
import {
  createClientPortalAccess,
  resetClientPortalPassword,
  revokeClientPortalAccess,
} from "@/lib/actions/agency/clients-portal-access";

interface PortalAccessProps {
  clientId: string;
  clientEmail: string;
  linkedUserId: string | null;
  linkedUserEmail?: string | null;
}

export function PortalAccessSection({
  clientId,
  clientEmail,
  linkedUserId,
  linkedUserEmail,
}: PortalAccessProps) {
  const [email, setEmail] = useState(clientEmail);
  const [name, setName] = useState("");
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [tempPassword, setTempPassword] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [hasAccess, setHasAccess] = useState(!!linkedUserId);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    setTempPassword(null);
    try {
      const result = await createClientPortalAccess({ clientId, email, name: name || undefined });
      setHasAccess(true);
      if (result.tempPassword) {
        setTempPassword(result.tempPassword);
        setMessage({ type: "success", text: "Acesso criado! Compartilhe a senha temporária abaixo." });
      } else {
        setMessage({ type: "success", text: "Usuário existente vinculado ao portal." });
      }
    } catch (err) {
      setMessage({ type: "error", text: err instanceof Error ? err.message : "Erro ao criar acesso" });
    } finally {
      setLoading(false);
    }
  }

  async function handleReset() {
    setLoading(true);
    setMessage(null);
    setTempPassword(null);
    try {
      const result = await resetClientPortalPassword({ clientId });
      setTempPassword(result.tempPassword);
      setMessage({ type: "success", text: "Nova senha gerada com sucesso." });
    } catch (err) {
      setMessage({ type: "error", text: err instanceof Error ? err.message : "Erro ao resetar senha" });
    } finally {
      setLoading(false);
    }
  }

  async function handleRevoke() {
    if (!confirm("Revogar o acesso ao portal deste cliente?")) return;
    setLoading(true);
    setMessage(null);
    setTempPassword(null);
    try {
      await revokeClientPortalAccess({ clientId });
      setHasAccess(false);
      setMessage({ type: "success", text: "Acesso ao portal revogado." });
    } catch (err) {
      setMessage({ type: "error", text: err instanceof Error ? err.message : "Erro ao revogar acesso" });
    } finally {
      setLoading(false);
    }
  }

  function copyPassword() {
    if (tempPassword) {
      navigator.clipboard.writeText(tempPassword);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Globe className="h-4 w-4 text-muted-foreground" />
          <CardTitle className="text-base">Acesso ao Portal</CardTitle>
        </div>
        <CardDescription>
          Gerencie o acesso deste cliente ao portal de autoatendimento.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {message && (
          <div
            className={`rounded-lg px-3 py-2 text-sm ${
              message.type === "error"
                ? "bg-destructive/10 text-destructive border border-destructive/20"
                : "bg-green-50 text-green-800 border border-green-200"
            }`}
          >
            {message.text}
          </div>
        )}

        {tempPassword && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 space-y-2">
            <p className="text-xs font-medium text-amber-800">Senha temporária (exibida uma vez):</p>
            <div className="flex items-center gap-2">
              <code className="flex-1 rounded bg-white px-3 py-1.5 text-sm font-mono border border-amber-200">
                {tempPassword}
              </code>
              <Button size="sm" variant="outline" onClick={copyPassword} className="shrink-0">
                {copied ? <CheckCircle className="h-3.5 w-3.5 text-green-600" /> : <Copy className="h-3.5 w-3.5" />}
              </Button>
            </div>
            <p className="text-xs text-amber-700">Informe ao cliente para trocar a senha no primeiro acesso.</p>
          </div>
        )}

        {!hasAccess ? (
          <form onSubmit={handleCreate} className="space-y-3">
            <div className="space-y-1">
              <Label htmlFor="portal-email">E-mail de acesso</Label>
              <Input
                id="portal-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="email@cliente.com"
                required
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="portal-name">Nome (opcional)</Label>
              <Input
                id="portal-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Nome do usuário"
              />
            </div>
            <Button type="submit" disabled={loading} className="w-full">
              {loading ? "Criando..." : "Criar acesso ao portal"}
            </Button>
          </form>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center justify-between rounded-lg border px-3 py-2">
              <div>
                <p className="text-sm font-medium">{linkedUserEmail ?? email}</p>
                <Badge variant="secondary" className="mt-1 text-xs">Portal ativo</Badge>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleReset}
                disabled={loading}
                className="flex-1"
              >
                <KeyRound className="mr-1.5 h-3.5 w-3.5" />
                Resetar senha
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleRevoke}
                disabled={loading}
                className="flex-1"
              >
                <UserX className="mr-1.5 h-3.5 w-3.5" />
                Revogar acesso
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
