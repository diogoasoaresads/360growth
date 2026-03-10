import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { deals, clients, userContexts } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Briefcase, Clock, Calendar, DollarSign } from "lucide-react";
import { PageContainer } from "@/components/workspace/PageContainer";

export const metadata = {
    title: "Meus Projetos | Portal do Cliente",
};

export default async function ClientProjectsPage() {
    const session = await auth();

    let clientId: string | null = null;
    if (session!.user.role === "SUPER_ADMIN") {
        const [ctx] = await db
            .select({ clientId: userContexts.activeClientId })
            .from(userContexts)
            .where(eq(userContexts.userId, session!.user.id))
            .limit(1);
        clientId = ctx?.clientId ?? null;
    } else {
        const clientRecord = await db.query.clients.findFirst({
            where: eq(clients.userId, session!.user.id),
            columns: { id: true },
        });
        clientId = clientRecord?.id ?? null;
    }

    if (!clientId) {
        return <div className="p-8 text-center text-muted-foreground">Cliente não encontrado.</div>;
    }

    const clientDeals = await db.query.deals.findMany({
        where: eq(deals.clientId, clientId),
        orderBy: [desc(deals.createdAt)],
    });

    const stageLabels: Record<string, string> = {
        LEAD: "Lead",
        QUALIFIED: "Qualificado",
        PROPOSAL: "Proposta",
        NEGOTIATION: "Negociação",
        CLOSED_WON: "Ganho",
        CLOSED_LOST: "Perdido",
    };

    return (
        <div className="p-6">
            <PageContainer
                title="Meus Projetos"
                description="Acompanhe o status e histórico de todas as suas iniciativas conosco."
            >
                {clientDeals.length === 0 ? (
                    <Card className="border-dashed py-12">
                        <CardContent className="flex flex-col items-center justify-center text-center">
                            <Briefcase className="h-12 w-12 text-muted-foreground/20 mb-4" />
                            <h3 className="text-lg font-semibold text-muted-foreground">Nenhum projeto registrado</h3>
                            <p className="text-sm text-muted-foreground max-w-xs mx-auto mt-2">
                                Quando iniciarmos um novo projeto ou negócio, ele aparecerá aqui para seu acompanhamento.
                            </p>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                        {clientDeals.map((deal) => (
                            <Card key={deal.id} className="overflow-hidden flex flex-col">
                                <CardHeader className="pb-4">
                                    <div className="flex justify-between items-start mb-1">
                                        <Badge variant="secondary" className="text-[10px] uppercase font-bold tracking-wider">
git add src/app/\(portal\)/portal/projects/page.tsx
git commit -m "resolve: merge conflict in portal/projects — keep safe stageId fallback"
git push

                                        </Badge>
                                        <span className="text-xs text-muted-foreground">
                                            ID: {deal.id.slice(0, 8)}
                                        </span>
                                    </div>
                                    <CardTitle className="text-lg line-clamp-1">{deal.title}</CardTitle>
                                    <CardDescription className="line-clamp-2 min-h-[2.5rem]">
                                        {deal.description || "Sem descrição disponível."}
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="flex-1 space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1">
                                            <p className="text-[10px] text-muted-foreground uppercase font-semibold">Valor</p>
                                            <div className="flex items-center gap-1.5">
                                                <DollarSign className="h-3.5 w-3.5 text-primary" />
                                                <span className="font-bold text-sm">
                                                    {deal.value ? Number(deal.value).toLocaleString("pt-BR", { style: "currency", currency: "BRL" }) : "N/A"}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-[10px] text-muted-foreground uppercase font-semibold">Probabilidade</p>
                                            <div className="flex items-center gap-1.5">
                                                <span className="font-bold text-sm text-primary">{deal.dealProbabilityDynamic || 0}%</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="pt-4 border-t space-y-3">
                                        <div className="flex items-center justify-between text-xs">
                                            <div className="flex items-center gap-2 text-muted-foreground">
                                                <Clock className="h-3.5 w-3.5" />
                                                <span>Criado em</span>
                                            </div>
                                            <span className="font-medium">
                                                {new Date(deal.createdAt).toLocaleDateString("pt-BR")}
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-between text-xs">
                                            <div className="flex items-center gap-2 text-muted-foreground">
                                                <Calendar className="h-3.5 w-3.5" />
                                                <span>Previsão</span>
                                            </div>
                                            <span className="font-medium">
                                                {deal.expectedCloseDate ? new Date(deal.expectedCloseDate).toLocaleDateString("pt-BR") : "A definir"}
                                            </span>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </PageContainer>
        </div>
    );
}
