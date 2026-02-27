"use client";

import { useRef, useTransition, useState } from "react";
import { toast } from "sonner";
import { Send, Paperclip } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { replyToTicket } from "@/lib/actions/admin/tickets";
import { useRouter } from "next/navigation";

interface TicketReplyFormProps {
  ticketId: string;
}

export function TicketReplyForm({ ticketId }: TicketReplyFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [content, setContent] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  function handleInput() {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 240)}px`;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim()) return;

    startTransition(async () => {
      const result = await replyToTicket(ticketId, { content });
      if (result.success) {
        setContent("");
        if (textareaRef.current) {
          textareaRef.current.style.height = "auto";
        }
        toast.success("Resposta enviada");
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="border rounded-lg bg-background shadow-sm">
      <Textarea
        ref={textareaRef}
        placeholder="Escreva sua resposta..."
        value={content}
        onChange={(e) => setContent(e.target.value)}
        onInput={handleInput}
        rows={3}
        className="resize-none border-0 focus-visible:ring-0 rounded-t-lg rounded-b-none text-sm"
        disabled={isPending}
      />
      <div className="flex items-center justify-between border-t px-3 py-2">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="text-muted-foreground"
          disabled
          title="Em breve"
        >
          <Paperclip className="h-4 w-4" />
        </Button>
        <Button type="submit" size="sm" disabled={isPending || !content.trim()}>
          <Send className="h-3.5 w-3.5 mr-1.5" />
          {isPending ? "Enviando..." : "Enviar resposta"}
        </Button>
      </div>
    </form>
  );
}
