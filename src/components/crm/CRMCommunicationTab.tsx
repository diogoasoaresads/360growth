import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
    Send,
    MessageCircle,
    Mail,
    History,
    CheckCheck
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { sendCRMMessage, getDealMessages } from "@/lib/actions/crm-messenger.actions";
import { toast } from "sonner";
import { DealMessage } from "@/lib/db/schema";

interface CRMCommunicationTabProps {
    dealId: string;
}

export function CRMCommunicationTab({ dealId }: CRMCommunicationTabProps) {
    const [messages, setMessages] = useState<DealMessage[]>([]);
    const [content, setContent] = useState("");
    const [channel, setChannel] = useState<"whatsapp" | "email">("whatsapp");
    const [loading, setLoading] = useState(false);

    const loadMessages = useCallback(async () => {
        const data = await getDealMessages(dealId);
        setMessages(data as DealMessage[]);
    }, [dealId]);

    useEffect(() => {
        loadMessages();
    }, [dealId, loadMessages]);

    const handleSend = async () => {
        if (!content.trim()) return;
        setLoading(true);
        try {
            await sendCRMMessage({ dealId, channel, content });
            setContent("");
            toast.success("Mensagem enviada com sucesso!");
            loadMessages();
        } catch (error) {
            console.error(error);
            toast.error("Erro ao enviar mensagem.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col h-[600px] border rounded-xl bg-slate-50/30 overflow-hidden">
            {/* Messages History */}
            <ScrollArea className="flex-1 p-4">
                <div className="space-y-4">
                    {messages.length === 0 && (
                        <div className="flex flex-col items-center justify-center py-12 text-slate-400 gap-2">
                            <History className="h-10 w-10 opacity-20" />
                            <p className="text-sm italic">Nenhuma mensagem registrada ainda.</p>
                        </div>
                    )}
                    {messages.map((msg) => (
                        <div
                            key={msg.id}
                            className={`flex flex-col ${msg.direction === 'OUTBOUND' ? 'items-end' : 'items-start'}`}
                        >
                            <div className={`max-w-[85%] p-3 rounded-2xl shadow-sm text-sm ${msg.direction === 'OUTBOUND'
                                ? 'bg-primary text-primary-foreground rounded-tr-none'
                                : 'bg-white text-slate-900 border rounded-tl-none'
                                }`}>
                                <div className="flex items-center gap-1 mb-1 opacity-80 text-[10px] uppercase font-bold">
                                    {msg.channel === 'whatsapp' ? <MessageCircle className="h-3 w-3" /> : <Mail className="h-3 w-3" />}
                                    {msg.channel}
                                </div>
                                <p className="whitespace-pre-wrap">{msg.message}</p>
                                <div className="flex items-center justify-end gap-1 mt-1 opacity-60 text-[10px]">
                                    {format(new Date(msg.sentAt), "HH:mm", { locale: ptBR })}
                                    {msg.status === 'SENT' && <CheckCheck className="h-3 w-3" />}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </ScrollArea>

            {/* Input Area */}
            <div className="p-4 bg-white border-t space-y-4">
                <div className="flex items-center gap-2">
                    <Button
                        variant={channel === 'whatsapp' ? 'default' : 'outline'}
                        size="sm"
                        className="h-8 text-[10px] font-bold uppercase rounded-lg"
                        onClick={() => setChannel('whatsapp')}
                    >
                        <MessageCircle className="mr-1 h-3 w-3" /> WhatsApp
                    </Button>
                    <Button
                        variant={channel === 'email' ? 'default' : 'outline'}
                        size="sm"
                        className="h-8 text-[10px] font-bold uppercase rounded-lg"
                        onClick={() => setChannel('email')}
                    >
                        <Mail className="mr-1 h-3 w-3" /> Email
                    </Button>
                </div>

                <div className="relative">
                    <Textarea
                        placeholder={`Digite sua mensagem via ${channel}...`}
                        className="min-h-[100px] bg-slate-50 border-none focus-visible:ring-1 focus-visible:ring-primary/20 resize-none pt-2 pr-12 text-sm"
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                    />
                    <Button
                        size="icon"
                        className="absolute bottom-2 right-2 h-8 w-8 rounded-full shadow-lg transition-transform hover:scale-105 active:scale-95"
                        disabled={loading || !content.trim()}
                        onClick={handleSend}
                    >
                        <Send className="h-4 w-4" />
                    </Button>
                </div>

                <p className="text-[10px] text-slate-400 text-right italic font-medium">
                    Aperte o botão para enviar o histórico para o lead
                </p>
            </div>
        </div>
    );
}
