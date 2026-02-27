import { db } from "@/lib/db";
import { auditLogs, users } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { EmptyState } from "@/components/admin/empty-state";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Activity } from "lucide-react";

interface Props {
  params: Promise<{ agencyId: string }>;
}

export default async function AgencyActivityPage({ params }: Props) {
  const { agencyId } = await params;
  const session = await auth();
  if (!session || session.user.role !== "SUPER_ADMIN") redirect("/unauthorized");

  const logs = await db
    .select({
      log: auditLogs,
      user: users,
    })
    .from(auditLogs)
    .leftJoin(users, eq(auditLogs.userId, users.id))
    .where(eq(auditLogs.agencyId, agencyId))
    .orderBy(desc(auditLogs.createdAt))
    .limit(100);

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Últimos {logs.length} evento{logs.length !== 1 ? "s" : ""} registrados
      </p>

      {logs.length === 0 ? (
        <EmptyState
          icon={Activity}
          title="Nenhuma atividade"
          description="Não há eventos de auditoria registrados para esta agência."
        />
      ) : (
        <div className="space-y-2">
          {logs.map(({ log, user }) => {
            const initials = user?.name
              ? user.name.split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase()
              : "?";
            return (
              <div
                key={log.id}
                className="flex items-start gap-3 rounded-lg border p-3 text-sm"
              >
                <Avatar className="h-7 w-7 mt-0.5">
                  <AvatarImage src={user?.image ?? undefined} />
                  <AvatarFallback className="text-xs">{initials}</AvatarFallback>
                </Avatar>
                <div className="flex-1 space-y-0.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium">{user?.name ?? "Sistema"}</span>
                    <Badge variant="outline" className="text-xs px-1.5 py-0">
                      {log.action}
                    </Badge>
                    {log.entityType && (
                      <span className="text-muted-foreground">{log.entityType}</span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {format(new Date(log.createdAt), "dd/MM/yyyy 'às' HH:mm", {
                      locale: ptBR,
                    })}
                    {log.ipAddress && ` · ${log.ipAddress}`}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
