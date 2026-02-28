"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Loader2, Eye } from "lucide-react";
import { upsertPlatformTemplate } from "@/lib/actions/admin/templates";

interface TemplateEditorProps {
  templateKey: string;
  initialSubject: string;
  initialBody: string;
  initialIsActive: boolean;
}

export function TemplateEditor({
  templateKey,
  initialSubject,
  initialBody,
  initialIsActive,
}: TemplateEditorProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [subject, setSubject] = useState(initialSubject);
  const [body, setBody] = useState(initialBody);
  const [isActive, setIsActive] = useState(initialIsActive);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(
    null
  );

  function notify(type: "success" | "error", text: string) {
    setFeedback({ type, text });
    setTimeout(() => setFeedback(null), 4000);
  }

  function handleSave() {
    startTransition(async () => {
      const result = await upsertPlatformTemplate({
        key: templateKey,
        subject,
        body,
        isActive,
      });
      if (result.success) {
        notify("success", "Template salvo com sucesso.");
        router.refresh();
      } else {
        notify("error", result.error);
      }
    });
  }

  // Simple preview: replace {{var}} with example values
  const previewHtml = body
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

  return (
    <div className="space-y-4">
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

      <div className="space-y-1">
        <Label htmlFor={`subject-${templateKey}`}>Assunto</Label>
        <Input
          id={`subject-${templateKey}`}
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          placeholder="Assunto do e-mail"
        />
      </div>

      <div className="space-y-1">
        <Label htmlFor={`body-${templateKey}`}>Corpo (Markdown)</Label>
        <Textarea
          id={`body-${templateKey}`}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={10}
          className="font-mono text-sm"
          placeholder="Corpo do e-mail em Markdown..."
        />
        <p className="text-xs text-muted-foreground">
          Use <code className="bg-muted px-1 rounded">{"{{variavel}}"}</code> para variáveis dinâmicas.
          Suporte a Markdown: **negrito**, *itálico*, # títulos, [link](url).
        </p>
      </div>

      <div className="flex items-center gap-2">
        <Switch
          id={`active-${templateKey}`}
          checked={isActive}
          onCheckedChange={setIsActive}
        />
        <Label htmlFor={`active-${templateKey}`}>Ativo</Label>
      </div>

      <div className="flex gap-2">
        <Button onClick={handleSave} disabled={isPending}>
          {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Salvar
        </Button>

        <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
          <DialogTrigger asChild>
            <Button variant="outline">
              <Eye className="mr-2 h-4 w-4" />
              Preview
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
            <DialogHeader>
              <DialogTitle className="text-sm font-mono">Preview — {templateKey}</DialogTitle>
            </DialogHeader>
            <div className="border rounded-md p-4 text-sm bg-white dark:bg-slate-950 flex-1 overflow-y-auto">
              <p className="text-xs text-muted-foreground mb-2 font-mono">
                Assunto: {subject}
              </p>
              <hr className="mb-3" />
              <div
                className="prose prose-sm dark:prose-invert max-w-none"
                dangerouslySetInnerHTML={{ __html: previewHtml }}
              />
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
