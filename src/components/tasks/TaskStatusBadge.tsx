import { Badge } from "@/components/ui/badge";
import { TaskStatus } from "@/lib/db/schema";
import { CheckCircle2, Clock, PlayCircle, XCircle } from "lucide-react";

interface StatusConfig {
    label: string;
    variant: "default" | "secondary" | "outline" | "destructive";
    icon: React.ElementType;
}

const statusMap: Record<TaskStatus, StatusConfig> = {
    PENDING: { label: "Pendente", variant: "outline", icon: Clock },
    IN_PROGRESS: { label: "Em Progresso", variant: "secondary", icon: PlayCircle },
    COMPLETED: { label: "Concluída", variant: "default", icon: CheckCircle2 },
    CANCELLED: { label: "Cancelada", variant: "destructive", icon: XCircle },
};

export function TaskStatusBadge({ status }: { status: TaskStatus }) {
    const config = statusMap[status] || statusMap.PENDING;
    const Icon = config.icon;

    return (
        <Badge variant={config.variant} className="gap-1 px-2 py-0 text-[10px] uppercase font-bold tracking-tighter">
            <Icon className="h-3 w-3" />
            {config.label}
        </Badge>
    );
}
