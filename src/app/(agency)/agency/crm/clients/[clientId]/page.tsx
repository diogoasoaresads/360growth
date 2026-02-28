import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { clients, users } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { notFound } from "next/navigation";
import { getActiveAgencyIdOrThrow } from "@/lib/active-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Mail, Phone, Building2 } from "lucide-react";
import Link from "next/link";
import { PortalAccessSection } from "./portal-access";

export const metadata = {
  title: "Cliente | CRM",
};

export default async function ClientDetailPage({
  params,
}: {
  params: Promise<{ clientId: string }>;
}) {
  await auth();
  const { clientId } = await params;

  const agencyId = await getActiveAgencyIdOrThrow();

  const [client] = await db
    .select({
      id: clients.id,
      name: clients.name,
      email: clients.email,
      phone: clients.phone,
      company: clients.company,
      status: clients.status,
      tags: clients.tags,
      notes: clients.notes,
      userId: clients.userId,
      createdAt: clients.createdAt,
    })
    .from(clients)
    .where(and(eq(clients.id, clientId), eq(clients.agencyId, agencyId)));

  if (!client) notFound();

  // Fetch linked user email if exists
  let linkedUserEmail: string | null = null;
  if (client.userId) {
    const [u] = await db
      .select({ email: users.email })
      .from(users)
      .where(eq(users.id, client.userId));
    linkedUserEmail = u?.email ?? null;
  }

  return (
    <div className="p-8 space-y-6 max-w-4xl">
      <div className="flex items-center gap-3">
        <Link href="/agency/crm/clients">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-1.5 h-4 w-4" />
            Clientes
          </Button>
        </Link>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Client info */}
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle>{client.name}</CardTitle>
                {client.company && (
                  <p className="text-sm text-muted-foreground mt-1">{client.company}</p>
                )}
              </div>
              <Badge variant={client.status === "active" ? "success" : "secondary"}>
                {client.status === "active" ? "Ativo" : "Inativo"}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Mail className="h-4 w-4" />
              {client.email}
            </div>
            {client.phone && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Phone className="h-4 w-4" />
                {client.phone}
              </div>
            )}
            {client.company && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Building2 className="h-4 w-4" />
                {client.company}
              </div>
            )}
            {client.tags && client.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 pt-1">
                {client.tags.map((tag) => (
                  <Badge key={tag} variant="outline" className="text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>
            )}
            {client.notes && (
              <p className="text-sm text-muted-foreground border-t pt-3 mt-3 whitespace-pre-wrap">
                {client.notes}
              </p>
            )}
          </CardContent>
        </Card>

        {/* Portal access */}
        <PortalAccessSection
          clientId={client.id}
          clientEmail={client.email}
          linkedUserId={client.userId ?? null}
          linkedUserEmail={linkedUserEmail}
        />
      </div>
    </div>
  );
}
