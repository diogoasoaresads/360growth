import { db } from "@/lib/db";
import { agencyUsers, users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { RoleBadge } from "@/components/admin/role-badge";
import { EmptyState } from "@/components/admin/empty-state";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Users } from "lucide-react";

interface Props {
  params: Promise<{ agencyId: string }>;
}

export default async function AgencyMembersPage({ params }: Props) {
  const { agencyId } = await params;
  const session = await auth();
  if (!session || session.user.role !== "SUPER_ADMIN") redirect("/unauthorized");

  const members = await db
    .select({
      agencyUser: agencyUsers,
      user: users,
    })
    .from(agencyUsers)
    .innerJoin(users, eq(agencyUsers.userId, users.id))
    .where(eq(agencyUsers.agencyId, agencyId));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {members.length} membro{members.length !== 1 ? "s" : ""}
        </p>
      </div>

      {members.length === 0 ? (
        <EmptyState
          icon={Users}
          title="Nenhum membro"
          description="Esta agência não possui membros cadastrados."
        />
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Usuário</TableHead>
                <TableHead>Função</TableHead>
                <TableHead>Adicionado em</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {members.map(({ agencyUser, user }) => {
                const initials = (user.name ?? user.email)
                  .split(" ")
                  .slice(0, 2)
                  .map((w) => w[0])
                  .join("")
                  .toUpperCase();
                return (
                  <TableRow key={agencyUser.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={user.image ?? undefined} />
                          <AvatarFallback className="text-xs">
                            {initials}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium leading-none">{user.name}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {user.email}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <RoleBadge role={agencyUser.role} />
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {format(new Date(agencyUser.createdAt), "dd/MM/yyyy", {
                        locale: ptBR,
                      })}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
