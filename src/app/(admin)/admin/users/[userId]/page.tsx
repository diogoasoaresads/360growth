import { notFound } from "next/navigation";
import Link from "next/link";
import { getUserById } from "@/lib/actions/admin/users";
import { PageHeader } from "@/components/admin/page-header";
import { StatusBadge } from "@/components/admin/status-badge";
import { RoleBadge } from "@/components/admin/role-badge";
import { EditUserModal } from "@/components/admin/users/edit-user-modal";
import { UserQuickActions } from "@/components/admin/users/user-quick-actions";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Mail, Calendar, Shield, Building2 } from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Props {
  params: Promise<{ userId: string }>;
}

export async function generateMetadata({ params }: Props) {
  const { userId } = await params;
  const result = await getUserById(userId);
  if (!result.success) return { title: "Usuário — AgencyHub Admin" };
  return { title: `${result.data.name ?? result.data.email} — AgencyHub Admin` };
}

export default async function UserDetailPage({ params }: Props) {
  const { userId } = await params;
  const result = await getUserById(userId);
  if (!result.success) notFound();

  const user = result.data;
  const name = user.name ?? user.email;
  const initials = name
    .split(" ")
    .slice(0, 2)
    .map((w: string) => w[0])
    .join("")
    .toUpperCase();

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button asChild variant="ghost" size="sm">
          <Link href="/admin/users">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Usuários
          </Link>
        </Button>
      </div>

      <PageHeader
        title={user.name ?? user.email}
        description={user.email}
      >
        <StatusBadge status={user.userStatus ?? "active"} />
        <EditUserModal user={user} />
      </PageHeader>

      {/* 2-column layout */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        {/* LEFT column 60% */}
        <div className="lg:col-span-3 space-y-6">
          {/* Personal Info */}
          <Card>
            <CardHeader>
              <CardTitle>Informações pessoais</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16">
                  <AvatarImage src={user.image ?? undefined} />
                  <AvatarFallback className="text-xl bg-primary/10 text-primary">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-lg font-semibold">{user.name ?? "—"}</p>
                  <p className="text-sm text-muted-foreground">{user.email}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 pt-2">
                {[
                  { icon: Shield, label: "Função", value: <RoleBadge role={user.role} /> },
                  { icon: Shield, label: "Status", value: <StatusBadge status={user.userStatus ?? "active"} /> },
                  {
                    icon: Mail,
                    label: "Email verificado",
                    value: user.emailVerified
                      ? format(new Date(user.emailVerified), "dd/MM/yyyy")
                      : "Não verificado",
                  },
                  {
                    icon: Calendar,
                    label: "Cadastrado em",
                    value: format(new Date(user.createdAt), "dd/MM/yyyy", { locale: ptBR }),
                  },
                  {
                    icon: Calendar,
                    label: "Último acesso",
                    value: user.lastLoginAt
                      ? formatDistanceToNow(new Date(user.lastLoginAt), { locale: ptBR, addSuffix: true })
                      : "Nunca",
                  },
                ].map(({ icon: Icon, label, value }) => (
                  <div key={label} className="flex items-start gap-2 text-sm">
                    <Icon className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-muted-foreground text-xs">{label}</p>
                      <div className="font-medium mt-0.5">{value}</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle>Atividade recente</CardTitle>
              <CardDescription>Últimas 10 ações registradas no audit log.</CardDescription>
            </CardHeader>
            <CardContent>
              {user.recentLogs.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nenhuma atividade registrada.</p>
              ) : (
                <div className="space-y-2">
                  {user.recentLogs.map((log) => (
                    <div
                      key={log.id}
                      className="flex items-start gap-3 rounded-md border p-3 text-sm"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge variant="outline" className="text-xs px-1.5 py-0">
                            {log.action}
                          </Badge>
                          {log.entityType && (
                            <span className="text-muted-foreground">{log.entityType}</span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {format(new Date(log.createdAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* RIGHT column 40% */}
        <div className="lg:col-span-2 space-y-6">
          {/* Agency Card */}
          <Card>
            <CardHeader>
              <CardTitle>Vínculo</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              {user.agency ? (
                <>
                  <div className="flex items-start gap-2">
                    <Building2 className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-xs text-muted-foreground">Agência</p>
                      <Link
                        href={`/admin/agencies/${user.agency.id}`}
                        className="font-medium hover:underline"
                      >
                        {user.agency.name}
                      </Link>
                      {user.agency.plan && (
                        <Badge variant="secondary" className="ml-2 text-xs">
                          {user.agency.plan.name}
                        </Badge>
                      )}
                    </div>
                  </div>
                  {user.agencyRole && (
                    <div>
                      <p className="text-xs text-muted-foreground">Função na agência</p>
                      <RoleBadge role={user.agencyRole as "AGENCY_ADMIN" | "AGENCY_MEMBER" | "SUPER_ADMIN" | "CLIENT"} />
                    </div>
                  )}
                  {user.memberSince && (
                    <div>
                      <p className="text-xs text-muted-foreground">Membro desde</p>
                      <p className="font-medium">
                        {format(new Date(user.memberSince), "dd/MM/yyyy", { locale: ptBR })}
                      </p>
                    </div>
                  )}
                </>
              ) : (
                <p className="text-muted-foreground">Sem vínculo com agência.</p>
              )}
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <UserQuickActions user={user} />
        </div>
      </div>
    </div>
  );
}
