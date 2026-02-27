import { notFound } from "next/navigation";
import { getAgencyById } from "@/lib/actions/admin/agencies";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { db } from "@/lib/db";
import { agencyUsers, clients } from "@/lib/db/schema";
import { eq, count } from "drizzle-orm";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Props {
  params: Promise<{ agencyId: string }>;
}

export default async function AgencySubscriptionPage({ params }: Props) {
  const { agencyId } = await params;
  const result = await getAgencyById(agencyId);
  if (!result.success) notFound();

  const agency = result.data;

  const [[{ membersCount }], [{ clientsCount }]] = await Promise.all([
    db.select({ membersCount: count() }).from(agencyUsers).where(eq(agencyUsers.agencyId, agencyId)),
    db.select({ clientsCount: count() }).from(clients).where(eq(clients.agencyId, agencyId)),
  ]);

  const membersPercent = Math.min(100, Math.round((membersCount / agency.maxMembers) * 100));
  const clientsPercent = Math.min(100, Math.round((clientsCount / agency.maxClients) * 100));

  return (
    <div className="space-y-6">
      {/* Subscription Status */}
      <Card>
        <CardHeader>
          <CardTitle>Status da assinatura</CardTitle>
          <CardDescription>
            Informações sobre a assinatura ativa da agência.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground w-32">Status</span>
            <Badge
              variant={
                agency.subscriptionStatus === "active" ? "default" : "secondary"
              }
            >
              {agency.subscriptionStatus ?? "Inativo"}
            </Badge>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground w-32">Plano</span>
            <span className="font-medium">{agency.plan?.name ?? "—"}</span>
          </div>
          {agency.stripeCustomerId && (
            <div className="flex items-center gap-3">
              <span className="text-sm text-muted-foreground w-32">
                Stripe Customer
              </span>
              <span className="font-mono text-xs">{agency.stripeCustomerId}</span>
            </div>
          )}
          {agency.stripeSubscriptionId && (
            <div className="flex items-center gap-3">
              <span className="text-sm text-muted-foreground w-32">
                Stripe Sub
              </span>
              <span className="font-mono text-xs">
                {agency.stripeSubscriptionId}
              </span>
            </div>
          )}
          {agency.trialEndsAt && (
            <div className="flex items-center gap-3">
              <span className="text-sm text-muted-foreground w-32">
                Trial até
              </span>
              <span className="font-medium">
                {format(new Date(agency.trialEndsAt), "dd 'de' MMMM 'de' yyyy", {
                  locale: ptBR,
                })}
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Usage */}
      <Card>
        <CardHeader>
          <CardTitle>Uso de recursos</CardTitle>
          <CardDescription>Utilização dos limites do plano.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">Membros</span>
              <span className="text-muted-foreground">
                {membersCount} / {agency.maxMembers}
              </span>
            </div>
            <Progress value={membersPercent} className="h-2" />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">Clientes</span>
              <span className="text-muted-foreground">
                {clientsCount} / {agency.maxClients}
              </span>
            </div>
            <Progress value={clientsPercent} className="h-2" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
