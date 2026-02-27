"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { createFeatureFlag, updateFeatureFlag } from "@/lib/actions/admin/config";
import type { FeatureFlagRow } from "@/lib/actions/admin/config";

interface FlagDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  existing?: FeatureFlagRow;
}

export function FlagDialog({ open, onOpenChange, existing }: FlagDialogProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const isEdit = !!existing;

  const [form, setForm] = useState({
    key: existing?.key ?? "",
    name: existing?.name ?? "",
    description: existing?.description ?? "",
    enabled: existing?.enabled ?? false,
    rolloutPercent: existing?.rolloutPercent ?? 100,
  });

  function set<K extends keyof typeof form>(k: K, v: (typeof form)[K]) {
    setForm((prev) => ({ ...prev, [k]: v }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      let result;
      if (isEdit) {
        result = await updateFeatureFlag(existing!.id, {
          name: form.name,
          description: form.description || undefined,
          enabled: form.enabled,
          rolloutPercent: form.rolloutPercent,
        });
      } else {
        result = await createFeatureFlag({
          key: form.key,
          name: form.name,
          description: form.description || undefined,
          enabled: form.enabled,
          rolloutPercent: form.rolloutPercent,
        });
      }
      if (result.success) {
        onOpenChange(false);
        router.refresh();
      } else {
        setError(result.error);
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Editar feature flag" : "Nova feature flag"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Key */}
          <div className="space-y-1.5">
            <Label htmlFor="flag-key">Chave</Label>
            <Input
              id="flag-key"
              value={form.key}
              onChange={(e) => set("key", e.target.value)}
              disabled={isEdit}
              placeholder="ex: new_dashboard_v2"
              className="font-mono text-sm"
            />
          </div>

          {/* Name */}
          <div className="space-y-1.5">
            <Label htmlFor="flag-name">Nome</Label>
            <Input
              id="flag-name"
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              placeholder="Novo Dashboard V2"
            />
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <Label htmlFor="flag-desc">Descrição (opcional)</Label>
            <Textarea
              id="flag-desc"
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
              rows={2}
              placeholder="Para que serve esta flag?"
            />
          </div>

          {/* Enabled */}
          <div className="flex items-center gap-3">
            <Switch
              id="flag-enabled"
              checked={form.enabled}
              onCheckedChange={(v) => set("enabled", v)}
            />
            <Label htmlFor="flag-enabled" className="cursor-pointer">
              Flag habilitada globalmente
            </Label>
          </div>

          {/* Rollout */}
          <div className="space-y-1.5">
            <Label htmlFor="flag-rollout">Rollout (%)</Label>
            <Input
              id="flag-rollout"
              type="number"
              min={0}
              max={100}
              value={form.rolloutPercent}
              onChange={(e) => set("rolloutPercent", Math.min(100, Math.max(0, Number(e.target.value))))}
            />
            <p className="text-xs text-muted-foreground">
              Percentual de agências que verão esta flag habilitada (0–100).
            </p>
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Salvando..." : isEdit ? "Salvar" : "Criar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
