import { notFound, redirect } from "next/navigation";
import { db } from "@/lib/db";
import { tickets, ticketMessages, users } from "@/lib/db/schema";
import { eq, and, asc } from "drizzle-orm";
import { getActiveAgencyIdOrThrow } from "@/lib/active-context";
import { isFeatureEnabled } from "@/lib/feature-flags/agency-flags";
import { auth } from "@/lib/auth";
import { TicketChat } from "@/components/tickets/TicketChat";
import { TicketSidebar } from "@/components/tickets/TicketSidebar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export const metadata = {
    title: "Detalhes do Ticket | Agência",
};

export default async function TicketDetailPage({ params }: { params: { id: string } }) {
    const session = await auth();
    if (!session) redirect("/login");

    const agencyId = await getActiveAgencyIdOrThrow();

    if (!await isFeatureEnabled(agencyId, "tickets_enabled")) {
        redirect("/agency/dashboard");
    }

    // Fetch ticket details
    const ticket = await db.query.tickets.findFirst({
        where: and(eq(tickets.id, params.id), eq(tickets.agencyId, agencyId)),
        with: {
            client: true,
            assignedUser: true,
        },
    });

    if (!ticket) {
        notFound();
    }

    // Fetch messages
    const messages = await db
        .select({
            id: ticketMessages.id,
            content: ticketMessages.content,
            isInternal: ticketMessages.isInternal,
            createdAt: ticketMessages.createdAt,
            user: {
                id: users.id,
                name: users.name,
            },
        })
        .from(ticketMessages)
        .innerJoin(users, eq(ticketMessages.userId, users.id))
        .where(eq(ticketMessages.ticketId, params.id))
        .orderBy(asc(ticketMessages.createdAt));

    return (
        <div className="p-6 h-full flex flex-col">
            <div className="mb-4">
                <Button variant="ghost" size="sm" asChild className="-ml-2 text-muted-foreground">
                    <Link href="/agency/tickets">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Voltar para Tickets
                    </Link>
                </Button>
            </div>

            <div className="flex items-start justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">{ticket.subject}</h1>
                    <p className="text-muted-foreground mt-1">
                        Ticket #{ticket.id.slice(0, 8)} • Cliente: <span className="font-medium text-foreground">{ticket.client?.name ?? "N/A"}</span>
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 flex-1">
                <div className="lg:col-span-3 flex flex-col min-h-[500px]">
                    <TicketChat
                        ticketId={ticket.id}
                        messages={messages as unknown as React.ComponentProps<typeof TicketChat>["messages"]}
                        currentUserId={session.user.id}
                    />
                </div>

                <div className="lg:col-span-1 space-y-6">
                    <TicketSidebar
                        ticketId={ticket.id}
                        currentStatus={ticket.status}
                        currentPriority={ticket.priority}
                    />

                    <Card>
                        <CardContent className="p-4 text-sm space-y-4">
                            <div>
                                <span className="text-muted-foreground block mb-1">Criado em</span>
                                <span className="font-medium">{new Date(ticket.createdAt).toLocaleDateString("pt-BR", { hour: '2-digit', minute: '2-digit' })}</span>
                            </div>

                            {ticket.assignedUser && (
                                <div>
                                    <span className="text-muted-foreground block mb-1">Responsável</span>
                                    <span className="font-medium">{ticket.assignedUser.name}</span>
                                </div>
                            )}

                            <div>
                                <span className="text-muted-foreground block mb-1">Tipo</span>
                                <Badge variant="outline">{ticket.type}</Badge>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
