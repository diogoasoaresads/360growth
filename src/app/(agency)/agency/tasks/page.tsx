import { db } from "@/lib/db";
import { tasks } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { getActiveAgencyIdOrThrow } from "@/lib/active-context";
import { PageContainer } from "@/components/workspace/PageContainer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, CheckSquare, ExternalLink } from "lucide-react";
import { TaskStatusBadge } from "@/components/tasks/TaskStatusBadge";
import { TaskActions } from "../../../../components/tasks/task-actions";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export const metadata = {
    title: "Minhas Tarefas | Agência",
};

export default async function AgencyTasksPage() {
    const agencyId = await getActiveAgencyIdOrThrow();

    const agencyTasks = await db.query.tasks.findMany({
        where: eq(tasks.agencyId, agencyId),
        orderBy: [desc(tasks.createdAt)],
        with: {
            responsible: true
        }
    });

    return (
        <div className="p-6">
            <PageContainer
                title="Gestão de Tarefas"
                description="Visualize e gerencie as tarefas geradas automaticamente ou criadas manualmente."
            >
                <div className="grid gap-6">
                    {agencyTasks.length === 0 ? (
                        <div className="flex flex-col items-center justify-center p-12 border-2 border-dashed rounded-lg">
                            <CheckSquare className="h-12 w-12 text-muted-foreground/20 mb-4" />
                            <h3 className="text-lg font-semibold">Tudo em dia!</h3>
                            <p className="text-sm text-muted-foreground">Nenhuma tarefa pendente no momento.</p>
                        </div>
                    ) : (
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                            {agencyTasks.map((task) => (
                                <Card key={task.id} className="hover:shadow-md transition-shadow">
                                    <CardHeader className="pb-2">
                                        <div className="flex justify-between items-start mb-2">
                                            <TaskStatusBadge status={task.status} />
                                            <Badge variant="outline" className="text-[10px]">
                                                {task.priority}
                                            </Badge>
                                        </div>
                                        <CardTitle className="text-base line-clamp-1">{task.title}</CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <p className="text-xs text-muted-foreground line-clamp-2 min-h-[2.5rem]">
                                            {task.description || "Sem descrição."}
                                        </p>

                                        <div className="flex items-center justify-between pt-4 border-t text-[10px]">
                                            <div className="flex items-center gap-1.5 text-muted-foreground">
                                                <Calendar className="h-3 w-3" />
                                                <span>{task.dueDate ? new Date(task.dueDate).toLocaleDateString("pt-BR") : "S/ data"}</span>
                                            </div>
                                            <div className="flex items-center gap-1.5">
                                                <span className="text-muted-foreground">Resp:</span>
                                                <span className="font-semibold">{task.responsible?.name || "Não atribuído"}</span>
                                            </div>
                                        </div>

                                        <div className="pt-2 flex items-center justify-between gap-2">
                                            <TaskActions taskId={task.id} currentStatus={task.status} />
                                            {task.entityId && (
                                                <Button variant="ghost" size="sm" asChild className="h-8 text-[10px] gap-1 px-2">
                                                    <Link href={task.entityType === "DEAL"
                                                        ? `/agency/crm/pipeline?dealId=${task.entityId}`
                                                        : `/agency/tickets/${task.entityId}`
                                                    }>
                                                        <ExternalLink className="h-3 w-3" /> Ver {task.entityType === "DEAL" ? "Negócio" : "Ticket"}
                                                    </Link>
                                                </Button>
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}
                </div>
            </PageContainer>
        </div>
    );
}
