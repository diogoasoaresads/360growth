import { db } from "@/lib/db";
import { contacts } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { getActiveAgencyIdOrThrow } from "@/lib/active-context";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Plus, Users, Mail, Phone, Briefcase } from "lucide-react";

export const metadata = {
  title: "Contatos | CRM",
};

async function getContacts(agencyId: string) {
  return db.query.contacts.findMany({
    where: eq(contacts.agencyId, agencyId),
    with: {
      client: true,
    },
    orderBy: [desc(contacts.createdAt)],
  });
}

export default async function ContactsPage() {
  const agencyId = await getActiveAgencyIdOrThrow();
  const contactsList = await getContacts(agencyId);

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Contatos</h1>
          <p className="text-muted-foreground mt-1">
            {contactsList.length} contato{contactsList.length !== 1 ? "s" : ""} cadastrado{contactsList.length !== 1 ? "s" : ""}
          </p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Novo Contato
        </Button>
      </div>

      {contactsList.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16 space-y-4">
            <Users className="h-16 w-16 text-muted-foreground/40" />
            <div className="text-center">
              <h3 className="font-semibold">Nenhum contato cadastrado</h3>
              <p className="text-muted-foreground text-sm mt-1">
                Adicione contatos vinculados aos seus clientes
              </p>
            </div>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Adicionar Contato
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {contactsList.map((contact) => {
            const contactWithClient = contact as typeof contact & {
              client?: { name?: string; company?: string };
            };
            return (
              <Card
                key={contact.id}
                className="hover:shadow-md transition-shadow cursor-pointer"
              >
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-semibold">{contact.name}</p>
                      {contact.position && (
                        <div className="flex items-center gap-1.5 mt-0.5 text-sm text-muted-foreground">
                          <Briefcase className="h-3.5 w-3.5" />
                          {contact.position}
                        </div>
                      )}
                    </div>
                    {contact.isPrimary && (
                      <Badge variant="outline" className="text-xs shrink-0">
                        Principal
                      </Badge>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    {contact.email && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Mail className="h-3.5 w-3.5 shrink-0" />
                        <span className="truncate">{contact.email}</span>
                      </div>
                    )}
                    {contact.phone && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Phone className="h-3.5 w-3.5 shrink-0" />
                        {contact.phone}
                      </div>
                    )}
                  </div>

                  {contactWithClient.client && (
                    <div className="pt-2 border-t">
                      <p className="text-xs text-muted-foreground">
                        Cliente:{" "}
                        <span className="font-medium text-foreground">
                          {contactWithClient.client.name}
                        </span>
                        {contactWithClient.client.company && (
                          <> · {contactWithClient.client.company}</>
                        )}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
