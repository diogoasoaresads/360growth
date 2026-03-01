import { db } from "@/lib/db";
import { clients } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Plus, Mail, Phone, Building2, Globe } from "lucide-react";
import Link from "next/link";
import { getActiveAgencyIdOrThrow } from "@/lib/active-context";
import { PageContainer } from "@/components/workspace/PageContainer";

export const metadata = {
  title: "Clientes | Agência",
};

export default async function ClientsPage() {
  const agencyId = await getActiveAgencyIdOrThrow();

  const clientsList = await db.query.clients.findMany({
    where: eq(clients.agencyId, agencyId),
    orderBy: [desc(clients.createdAt)],
  });

  return (
    <div className="p-6">
      <PageContainer
        title="Clientes"
        description={`${clientsList.length} cliente${clientsList.length !== 1 ? "s" : ""} cadastrado${clientsList.length !== 1 ? "s" : ""}`}
        actions={
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Novo Cliente
          </Button>
        }
      >
      {clientsList.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16 space-y-4">
            <Building2 className="h-16 w-16 text-muted-foreground/40" />
            <div className="text-center">
              <h3 className="font-semibold">Nenhum cliente cadastrado</h3>
              <p className="text-muted-foreground text-sm mt-1">
                Comece adicionando seu primeiro cliente
              </p>
            </div>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Adicionar Cliente
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {clientsList.map((client) => (
            <Link key={client.id} href={`/agency/crm/clients/${client.id}`}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-base">{client.name}</CardTitle>
                      {client.company && (
                        <p className="text-sm text-muted-foreground mt-0.5">{client.company}</p>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <Badge variant={client.status === "active" ? "success" : "secondary"}>
                        {client.status === "active" ? "Ativo" : "Inativo"}
                      </Badge>
                      {client.userId && (
                        <Badge variant="outline" className="text-xs gap-1">
                          <Globe className="h-2.5 w-2.5" />
                          Portal
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Mail className="h-3.5 w-3.5" />
                    {client.email}
                  </div>
                  {client.phone && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Phone className="h-3.5 w-3.5" />
                      {client.phone}
                    </div>
                  )}
                  {client.tags && client.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {client.tags.map((tag) => (
                        <Badge key={tag} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
      </PageContainer>
    </div>
  );
}
