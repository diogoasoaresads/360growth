"use client";

import { useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";
import { Loader2, Send } from "lucide-react";
import { addTicketMessage } from "@/lib/actions/ticket.actions";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

interface Message {
    id: string;
    content: string;
    isInternal: boolean;
    createdAt: Date;
    user: {
        id: string;
        name: string | null;
    }
}

interface TicketChatProps {
    ticketId: string;
    messages: Message[];
    currentUserId: string;
}

export function TicketChat({ ticketId, messages, currentUserId }: TicketChatProps) {
    const [content, setContent] = useState("");
    const [isInternal, setIsInternal] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!content.trim()) return;

        try {
            setIsSubmitting(true);
            await addTicketMessage(ticketId, { content, isInternal });
            setContent("");
            setIsInternal(false);
        } catch {
            toast.error("Erro ao enviar mensagem");
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <div className="flex flex-col h-[calc(100vh-220px)] bg-background rounded-md border shadow-sm">
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((msg) => {
                    const isMe = msg.user.id === currentUserId;
                    return (
                        <div
                            key={msg.id}
                            className={`flex flex-col max-w-[85%] ${isMe ? "ml-auto items-end" : "mr-auto items-start"}`}
                        >
                            <div className="flex items-center gap-2 mb-1">
                                <span className="text-xs text-muted-foreground">
                                    {msg.user.name} • {format(new Date(msg.createdAt), "dd MMM HH:mm", { locale: ptBR })}
                                </span>
                                {msg.isInternal && (
                                    <span className="text-[10px] bg-yellow-500/20 text-yellow-700 px-1.5 py-0.5 rounded uppercase font-semibold">
                                        Nota Interna
                                    </span>
                                )}
                            </div>
                            <div
                                className={`p-3 rounded-xl text-sm whitespace-pre-wrap ${msg.isInternal
                                    ? "bg-yellow-100 text-yellow-900 border-yellow-200"
                                    : isMe
                                        ? "bg-primary text-primary-foreground"
                                        : "bg-muted"
                                    }`}
                            >
                                {msg.content}
                            </div>
                        </div>
                    );
                })}
            </div>

            <div className="p-4 border-t bg-muted/30">
                <form onSubmit={handleSubmit} className="space-y-4">
                    <Textarea
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        placeholder="Digite sua resposta..."
                        className="resize-none"
                        rows={3}
                    />
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                            <Switch id="internal" checked={isInternal} onCheckedChange={setIsInternal} />
                            <Label htmlFor="internal">Nota Interna (O cliente não vê)</Label>
                        </div>
                        <Button type="submit" disabled={isSubmitting || !content.trim()}>
                            {isSubmitting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Send className="h-4 w-4 mr-2" />}
                            {isSubmitting ? "Enviando..." : "Responder"}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}
