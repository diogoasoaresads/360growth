import { db } from "@/lib/db";
import { automationWorkflows } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { getActiveAgencyIdOrThrow } from "@/lib/active-context";
import { AutomationList } from "@/components/automation/AutomationList";
import { CreateWorkflowButton } from "@/components/automation/CreateWorkflowButton";
import { PageContainer } from "@/components/workspace/PageContainer";
import { BrainCircuit } from "lucide-react";

export const metadata = {
    title: "Automações | Configurações",
};

export default async function AutomationsSettingsPage() {
    const agencyId = await getActiveAgencyIdOrThrow();

    const workflows = await db.query.automationWorkflows.findMany({
        where: eq(automationWorkflows.agencyId, agencyId),
        orderBy: [desc(automationWorkflows.createdAt)],
    });

    return (
        <div className="p-6">
            <PageContainer
                title="Automações e Workflows"
                description="Configure regras automáticas para economizar tempo e padronizar processos."
            >
                <div className="flex justify-end mb-6">
                    <CreateWorkflowButton />
                </div>

                {workflows.length === 0 ? (
                    <div className="flex flex-col items-center justify-center p-12 border-2 border-dashed rounded-lg bg-muted/20">
                        <BrainCircuit className="h-12 w-12 text-muted-foreground/30 mb-4" />
                        <h3 className="text-lg font-semibold">Nenhuma automação ativa</h3>
                        <p className="text-sm text-muted-foreground text-center max-w-sm mt-2">
                            Crie sua primeira regra para automatizar tarefas quando o estágio de um negócio mudar ou um ticket for criado.
                        </p>
                    </div>
                ) : (
                    <AutomationList initialWorkflows={workflows} />
                )}
            </PageContainer>
        </div>
    );
}
