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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { createPlatformSetting, updatePlatformSetting } from "@/lib/actions/admin/config";
import type { PlatformSettingRow } from "@/lib/actions/admin/config";
import type { SettingType } from "@/lib/db/schema";

interface SettingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  existing?: PlatformSettingRow;
}

export function SettingDialog({ open, onOpenChange, existing }: SettingDialogProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const isEdit = !!existing;

  const [form, setForm] = useState({
    key: existing?.key ?? "",
    value: isEdit && existing?.isSecret ? "" : (existing?.value ?? ""),
    type: (existing?.type ?? "string") as SettingType,
    description: existing?.description ?? "",
    isSecret: existing?.isSecret ?? false,
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
        result = await updatePlatformSetting(existing!.key, {
          value: form.value,
          type: form.type,
          description: form.description || undefined,
          isSecret: form.isSecret,
        });
      } else {
        result = await createPlatformSetting({
          key: form.key,
          value: form.value,
          type: form.type,
          description: form.description || undefined,
          isSecret: form.isSecret,
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
          <DialogTitle>
            {isEdit ? "Editar configuração" : "Nova configuração"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Key */}
          <div className="space-y-1.5">
            <Label htmlFor="key">Chave</Label>
            <Input
              id="key"
              value={form.key}
              onChange={(e) => set("key", e.target.value)}
              disabled={isEdit}
              placeholder="ex: email.smtp_host"
              className="font-mono text-sm"
            />
          </div>

          {/* Type */}
          <div className="space-y-1.5">
            <Label>Tipo</Label>
            <Select value={form.type} onValueChange={(v) => set("type", v as SettingType)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="string">string</SelectItem>
                <SelectItem value="number">number</SelectItem>
                <SelectItem value="boolean">boolean (true/false)</SelectItem>
                <SelectItem value="json">json</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Value */}
          <div className="space-y-1.5">
            <Label htmlFor="value">
              Valor
              {isEdit && existing?.isSecret && (
                <span className="ml-2 text-xs text-muted-foreground">
                  (deixe vazio para manter o valor atual)
                </span>
              )}
            </Label>
            {form.type === "json" ? (
              <Textarea
                id="value"
                value={form.value}
                onChange={(e) => set("value", e.target.value)}
                rows={4}
                className="font-mono text-sm"
                placeholder='{"key": "value"}'
              />
            ) : (
              <Input
                id="value"
                type={form.isSecret ? "password" : "text"}
                value={form.value}
                onChange={(e) => set("value", e.target.value)}
                placeholder={
                  form.type === "boolean"
                    ? "true ou false"
                    : form.type === "number"
                    ? "0"
                    : "valor"
                }
              />
            )}
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <Label htmlFor="description">Descrição (opcional)</Label>
            <Textarea
              id="description"
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
              rows={2}
              placeholder="Para que serve esta configuração?"
            />
          </div>

          {/* isSecret */}
          <div className="flex items-center gap-3">
            <Switch
              id="isSecret"
              checked={form.isSecret}
              onCheckedChange={(v) => set("isSecret", v)}
            />
            <Label htmlFor="isSecret" className="cursor-pointer">
              Valor secreto (mascarado na UI)
            </Label>
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
