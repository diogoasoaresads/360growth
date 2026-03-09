"use client";

import { useState, useEffect } from "react";
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetDescription,
    SheetFooter
} from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
    Calendar,
    Lightbulb,
    ChevronUp,
    ChevronDown,
    Flame,
    AlertTriangle,
    Moon,
    AlertCircle,
    Target,
    Copy
} from "lucide-react";
import { Deal, Client, User, PipelineStage, Playbook } from "@/lib/db/schema";
import { calculateDealScore, getPriorityLabel, getDealInsights, DealScoreInput } from "@/lib/crm/crm-intelligence";
import { getPlaybookByStage, updateDealChecklist } from "@/lib/actions/playbook.actions";
import { CRMCommunicationTab } from "./CRMCommunicationTab";
import { toast } from "sonner";

// Type already imported

interface DealExtended extends Deal {
    client?: Client | null;
    responsible?: User | null;
    stage?: PipelineStage | null;
}

interface DealDetailsDrawerProps {
    deal: DealExtended | null;
    isOpen: boolean;
    onClose: () => void;
}

export function DealDetailsDrawer({ deal, isOpen, onClose }: DealDetailsDrawerProps) {
    const [playbook, setPlaybook] = useState<Playbook | null>(null);
    const [checklist, setChecklist] = useState<Record<string, boolean>>(deal?.checklistProgress || {});
    const [isScriptsOpen, setIsScriptsOpen] = useState(false);

    useEffect(() => {
        if (deal?.stageId) {
            getPlaybookByStage(deal.stageId).then(res => setPlaybook(res || null));
        }
        if (deal) {
            setChecklist(deal.checklistProgress || {});
        }
    }, [deal]);

    if (!deal) return null;

    const score = calculateDealScore(deal as DealScoreInput);
    const priority = getPriorityLabel(score);
    const PriorityIcon = priority.icon === "Flame" ? Flame : priority.icon === "AlertTriangle" ? AlertTriangle : Moon;
    const insights = getDealInsights(deal as DealScoreInput);

    const handleChecklistChange = async (item: string, checked: boolean) => {
        const newChecklist = { ...checklist, [item]: checked };
        setChecklist(newChecklist);
        try {
            await updateDealChecklist(deal.id, newChecklist);
        } catch (err) {
            console.error(err);
            toast.error("Erro ao atualizar checklist");
        }
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        toast.success("Copiado para a área de transferência");
    };

    const checklistTotal = playbook?.checklist?.length || 0;
    const checklistCompleted = Object.values(checklist).filter(Boolean).length;
    const progress = checklistTotal > 0 ? (checklistCompleted / checklistTotal) * 100 : 0;

    return (
        <Sheet open={isOpen} onOpenChange={onClose}>
            <SheetContent className="sm:max-w-xl w-full p-0 flex flex-col h-full overflow-hidden">
                <SheetHeader className="p-6 pb-2">
                    <div className="flex items-center justify-between mb-2">
                        <Badge variant="outline" className="text-[10px] uppercase font-bold">
                            {deal.stage?.name || "Sem Etapa"}
                        </Badge>
                        <Badge className={`${priority.color} text-white gap-1.5 px-3 py-1`}>
                            <PriorityIcon className="h-3.5 w-3.5" /> {priority.label}
                        </Badge>
                    </div>
                    <SheetTitle className="text-2xl font-bold">{deal.title}</SheetTitle>
                    <SheetDescription>
                        {deal.client?.name} | {deal.value ? Number(deal.value).toLocaleString("pt-BR", { style: "currency", currency: deal.currency || "BRL" }) : "R$ 0,00"}
                    </SheetDescription>
                </SheetHeader>

                <Tabs defaultValue="intelligence" className="flex-1 flex flex-col overflow-hidden">
                    <div className="px-6">
                        <TabsList className="grid w-full grid-cols-3 h-9">
                            <TabsTrigger value="intelligence" className="text-[10px] uppercase font-bold">🎯 Inteligência</TabsTrigger>
                            <TabsTrigger value="playbook" className="text-[10px] uppercase font-bold">📋 Playbook</TabsTrigger>
                            <TabsTrigger value="communication" className="text-[10px] uppercase font-bold">💬 Conversa</TabsTrigger>
                        </TabsList>
                    </div>

                    <ScrollArea className="flex-1 mt-4 px-6">
                        <div className="pb-6">
                            <TabsContent value="intelligence" className="mt-0 space-y-6">
                                {/* Risk Alert (New Phase 4) */}
                                {deal.dealRiskLevel === 'HIGH' && (
                                    <div className="bg-red-50 border border-red-100 rounded-xl p-4 flex items-start gap-3">
                                        <AlertCircle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
                                        <div>
                                            <p className="text-sm font-bold text-red-900">Alto Risco de Perda!</p>
                                            <p className="text-xs text-red-700">Este negócio está parado há muito tempo ou sem próxima ação. Priorize o contato imediato.</p>
                                        </div>
                                    </div>
                                )}

                                {/* Intelligence Section */}
                                <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                                    <div className="flex items-center gap-2 mb-3">
                                        <Lightbulb className="h-5 w-5 text-amber-500" />
                                        <h3 className="font-semibold text-sm">Resumo da IA & Score ({score})</h3>
                                    </div>
                                    <div className="space-y-3">
                                        {deal.dealSummary ? (
                                            <div className="bg-white p-3 rounded-lg border border-slate-200 text-xs text-slate-700 leading-relaxed shadow-sm">
                                                <p className="font-bold text-[10px] uppercase text-slate-400 mb-1">Resumo Executivo</p>
                                                {deal.dealSummary}
                                            </div>
                                        ) : (
                                            <div className="text-xs text-slate-400 italic text-center py-4 bg-white/50 rounded-lg border border-dashed">
                                                Nenhum resumo gerado pela IA ainda.
                                            </div>
                                        )}

                                        <div className="space-y-2">
                                            <p className="font-bold text-[10px] uppercase text-slate-400">Sugestões e Insights</p>
                                            {insights.map((insight, i) => (
                                                <div key={i} className="flex gap-2 text-xs text-slate-600 bg-white p-2 rounded border border-slate-50 italic">
                                                    <AlertCircle className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                                                    <span>{insight}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                {/* Operational Details */}
                                <div className="space-y-4">
                                    <h3 className="font-semibold flex items-center gap-2">
                                        <Calendar className="h-5 w-5 text-primary" />
                                        Detalhes Operacionais
                                    </h3>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="p-3 rounded-lg border bg-white shadow-sm">
                                            <span className="text-[10px] uppercase font-bold text-muted-foreground">Próxima Ação</span>
                                            <p className="text-sm font-medium mt-1">{deal.nextActionDate ? new Date(deal.nextActionDate).toLocaleDateString("pt-BR") : "Não definida"}</p>
                                            <p className="text-xs text-muted-foreground truncate">{deal.nextActionDescription || "---"}</p>
                                        </div>
                                        <div className="p-3 rounded-lg border bg-white shadow-sm">
                                            <span className="text-[10px] uppercase font-bold text-muted-foreground">Fechamento Esperado</span>
                                            <p className="text-sm font-medium mt-1">{deal.expectedCloseDate ? new Date(deal.expectedCloseDate).toLocaleDateString("pt-BR") : "Não definida"}</p>
                                            <p className="text-xs text-muted-foreground truncate italic">Status: {deal.status}</p>
                                        </div>
                                    </div>
                                </div>
                            </TabsContent>

                            <TabsContent value="playbook" className="mt-0 space-y-6">
                                {/* Playbook Section */}
                                {playbook ? (
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <Target className="h-5 w-5 text-primary" />
                                                <h3 className="font-semibold">Playbook da Etapa</h3>
                                            </div>
                                            <span className="text-xs font-medium text-muted-foreground">{checklistCompleted}/{checklistTotal} concluídos</span>
                                        </div>

                                        <Progress value={progress} className="h-2" />

                                        <div className="bg-white rounded-xl border p-4 space-y-4 shadow-sm">
                                            <div className="space-y-3">
                                                <h4 className="text-xs font-bold uppercase text-muted-foreground tracking-wider">Checklist</h4>
                                                <div className="space-y-2">
                                                    {playbook.checklist.map((item: string, i: number) => (
                                                        <div key={i} className="flex items-center gap-2">
                                                            <Checkbox
                                                                id={`item-${i}`}
                                                                checked={!!checklist[item]}
                                                                onCheckedChange={(checked) => handleChecklistChange(item, !!checked)}
                                                            />
                                                            <label
                                                                htmlFor={`item-${i}`}
                                                                className={`text-sm ${checklist[item] ? 'line-through text-muted-foreground' : ''}`}
                                                            >
                                                                {item}
                                                            </label>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>

                                            <Separator />

                                            <div className="space-y-2">
                                                <h4 className="text-xs font-bold uppercase text-muted-foreground tracking-wider">Ações Recomendadas</h4>
                                                <p className="text-sm text-slate-600 line-height-relaxed whitespace-pre-wrap">
                                                    {playbook.recommendedActions || "Siga o checklist padrão para avançar o negócio."}
                                                </p>
                                            </div>

                                            {(playbook.scripts?.length ?? 0) > 0 && (
                                                <>
                                                    <Separator />
                                                    <div className="space-y-2">
                                                        <button
                                                            onClick={() => setIsScriptsOpen(!isScriptsOpen)}
                                                            className="flex items-center justify-between w-full text-xs font-bold uppercase text-muted-foreground tracking-wider"
                                                        >
                                                            Scripts sugeridos
                                                            {isScriptsOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                                                        </button>

                                                        {isScriptsOpen && (
                                                            <div className="space-y-3 pt-2">
                                                                {(playbook.scripts as Array<{ label: string, text: string }>).map((script, i: number) => (
                                                                    <div key={i} className="bg-slate-50 p-3 rounded-lg border group relative">
                                                                        <span className="text-[10px] font-bold text-primary block mb-1 uppercase">{script.label}</span>
                                                                        <p className="text-xs text-slate-600 italic">&ldquo;{script.text}&rdquo;</p>
                                                                        <Button
                                                                            variant="ghost"
                                                                            size="icon"
                                                                            className="absolute top-2 right-2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                                                                            onClick={() => copyToClipboard(script.text)}
                                                                        >
                                                                            <Copy className="h-3 w-3" />
                                                                        </Button>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="p-8 border-2 border-dashed rounded-xl flex flex-col items-center justify-center text-center space-y-2">
                                        <Target className="h-8 w-8 text-muted-foreground/30" />
                                        <p className="text-sm text-muted-foreground italic">Esta etapa ainda não possui um Playbook configurado.</p>
                                        <Button variant="link" size="sm" className="text-xs">Configurar Playbook</Button>
                                    </div>
                                )}
                            </TabsContent>

                            <TabsContent value="communication" className="mt-0 h-full">
                                <CRMCommunicationTab dealId={deal.id} />
                            </TabsContent>
                        </div>
                    </ScrollArea>
                </Tabs>

                <SheetFooter className="p-6 border-t bg-slate-50">
                    <div className="flex items-center justify-between w-full">
                        <div className="flex flex-col">
                            <span className="text-[10px] uppercase font-bold text-muted-foreground">Responsável</span>
                            <span className="text-sm font-medium">{deal.responsible?.name || "Não atribuído"}</span>
                        </div>
                        <div className="flex gap-2">
                            <Button variant="outline" onClick={onClose}>Fechar</Button>
                            <Button>Editar Negócio</Button>
                        </div>
                    </div>
                </SheetFooter>
            </SheetContent>
        </Sheet>
    );
}
