"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Loader2, Pencil, X, Eye } from "lucide-react";
import {
  upsertAgencyTemplateOverride,
  clearAgencyTemplateOverride,
} from "@/lib/actions/admin/templates";
import type { MessageTemplate } from "@/lib/db/schema";

interface AgencyTemplatesPanelProps {
  agencyId: string;
  /** Platform (default) templates */
  platformTemplates: MessageTemplate[];
  /** Agency overrides (subset of platform keys) */
  agencyOverrides: MessageTemplate[];
}

export function AgencyTemplatesPanel({
  agencyId,
  platformTemplates,
  agencyOverrides,
}: AgencyTemplatesPanelProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(
    null
  );
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [editSubject, setEditSubject] = useState("");
  const [editBody, setEditBody] = useState("");
  const [editIsActive, setEditIsActive] = useState(true);
  const [previewKey, setPreviewKey] = useState<string | null>(null);

  function notify(type: "success" | "error", text: string) {
    setFeedback({ type, text });
    setTimeout(() => setFeedback(null), 4000);
  }

  function openEditor(tpl: MessageTemplate) {
    setEditingKey(tpl.key);
    setEditSubject(tpl.subject);
    setEditBody(tpl.body);
    setEditIsActive(tpl.isActive);
  }

  function openEditorFromPlatform(tpl: MessageTemplate) {
    // Pre-fill from platform template when creating a new override
    setEditingKey(tpl.key);
    setEditSubject(tpl.subject);
    setEditBody(tpl.body);
    setEditIsActive(tpl.isActive);
  }

  function handleSave() {
    if (!editingKey) return;
    startTransition(async () => {
      const result = await upsertAgencyTemplateOverride({
        agencyId,
        key: editingKey,
        subject: editSubject,
        body: editBody,
        isActive: editIsActive,
      });
      if (result.success) {
        notify("success", `Override de "${editingKey}" salvo.`);
        setEditingKey(null);
        router.refresh();
      } else {
        notify("error", result.error);
      }
    });
  }

  function handleClear(key: string) {
    startTransition(async () => {
      const result = await clearAgencyTemplateOverride({ agencyId, key });
      if (result.success) {
        notify("success", `Override de "${key}" removido. Volta ao template da plataforma.`);
        router.refresh();
      } else {
        notify("error", result.error);
      }
    });
  }

  const overrideMap = new Map(agencyOverrides.map((o) => [o.key, o]));

  // Simple preview
  function buildPreviewHtml(body: string): string {
    return body
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/\{\{(\w+)\}\}/g, '<mark title="variável: $1">[$1]</mark>')
      .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
      .replace(/\*([^*]+)\*/g, "<em>$1</em>")
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="text-blue-600 underline">$1</a>')
      .replace(/^###\s+(.*)/gm, "<h3 class='text-base font-semibold mt-3'>$1</h3>")
      .replace(/^##\s+(.*)/gm, "<h2 class='text-lg font-bold mt-4'>$1</h2>")
      .replace(/^#\s+(.*)/gm, "<h1 class='text-xl font-bold mt-4'>$1</h1>")
      .replace(/\n/g, "<br>");
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Templates de Mensagem</CardTitle>
        <CardDescription>
          Overrides por agência — sobrepõem os templates da plataforma.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {feedback && (
          <p
            className={`text-sm rounded-md px-3 py-2 ${
              feedback.type === "success"
                ? "bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400"
                : "bg-destructive/10 text-destructive"
            }`}
          >
            {feedback.text}
          </p>
        )}

        <div className="divide-y">
          {platformTemplates.map((platform) => {
            const override = overrideMap.get(platform.key);
            const isEditing = editingKey === platform.key;
            const previewSource = override ?? platform;

            return (
              <div key={platform.key} className="py-4 space-y-3">
                {/* Header row */}
                <div className="flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm font-mono">{platform.key}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Canal: {platform.channel}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {override ? (
                      <Badge variant="default" className="text-[10px]">Override ativo</Badge>
                    ) : (
                      <Badge variant="secondary" className="text-[10px]">Padrão plataforma</Badge>
                    )}

                    {/* Preview button */}
                    <Dialog
                      open={previewKey === platform.key}
                      onOpenChange={(open) => setPreviewKey(open ? platform.key : null)}
                    >
                      <DialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-7 w-7" title="Preview">
                          <Eye className="h-3 w-3" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
                        <DialogHeader>
                          <DialogTitle className="text-sm font-mono">
                            Preview — {platform.key}
                            {override ? " (override)" : " (plataforma)"}
                          </DialogTitle>
                        </DialogHeader>
                        <div className="border rounded-md p-4 text-sm bg-white dark:bg-slate-950 flex-1 overflow-y-auto">
                          <p className="text-xs text-muted-foreground mb-2 font-mono">
                            Assunto: {previewSource.subject}
                          </p>
                          <hr className="mb-3" />
                          <div
                            className="prose prose-sm dark:prose-invert max-w-none"
                            dangerouslySetInnerHTML={{ __html: buildPreviewHtml(previewSource.body) }}
                          />
                        </div>
                      </DialogContent>
                    </Dialog>

                    {/* Edit button */}
                    {!isEditing && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        title={override ? "Editar override" : "Criar override"}
                        onClick={() =>
                          override ? openEditor(override) : openEditorFromPlatform(platform)
                        }
                        disabled={isPending}
                      >
                        <Pencil className="h-3 w-3" />
                      </Button>
                    )}

                    {/* Clear override button */}
                    {override && !isEditing && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        title="Remover override"
                        onClick={() => handleClear(platform.key)}
                        disabled={isPending}
                      >
                        {isPending ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <X className="h-3 w-3" />
                        )}
                      </Button>
                    )}
                  </div>
                </div>

                {/* Inline editor */}
                {isEditing && (
                  <div className="border rounded-md p-4 space-y-3 bg-muted/30">
                    <div className="space-y-1">
                      <Label htmlFor={`override-subject-${platform.key}`}>Assunto</Label>
                      <Input
                        id={`override-subject-${platform.key}`}
                        value={editSubject}
                        onChange={(e) => setEditSubject(e.target.value)}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor={`override-body-${platform.key}`}>Corpo (Markdown)</Label>
                      <Textarea
                        id={`override-body-${platform.key}`}
                        value={editBody}
                        onChange={(e) => setEditBody(e.target.value)}
                        rows={8}
                        className="font-mono text-sm"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        id={`override-active-${platform.key}`}
                        checked={editIsActive}
                        onCheckedChange={setEditIsActive}
                      />
                      <Label htmlFor={`override-active-${platform.key}`}>Ativo</Label>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" onClick={handleSave} disabled={isPending}>
                        {isPending && <Loader2 className="mr-2 h-3 w-3 animate-spin" />}
                        Salvar
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setEditingKey(null)}
                        disabled={isPending}
                      >
                        Cancelar
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          {platformTemplates.length === 0 && (
            <p className="text-sm text-muted-foreground py-4 text-center">
              Nenhum template de plataforma encontrado.
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
