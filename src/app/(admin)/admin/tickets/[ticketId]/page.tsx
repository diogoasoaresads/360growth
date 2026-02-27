import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ArrowLeft, Paperclip } from "lucide-react";
import { getAdminTicketById } from "@/lib/actions/admin/tickets";
import { TicketReplyForm } from "@/components/admin/tickets/ticket-reply-form";
import { TicketStatusActions } from "@/components/admin/tickets/ticket-status-actions";
import { RoleBadge } from "@/components/admin/role-badge";
import { StatusBadge } from "@/components/admin/status-badge";
import { PlanBadge } from "@/components/admin/plan-badge";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import type { TicketMessageWithUser } from "@/lib/actions/admin/tickets";

interface Props {
  params: Promise<{ ticketId: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { ticketId } = await params;
  const result = await getAdminTicketById(ticketId);
  if (!result.success) return { title: "Ticket não encontrado" };
  return { title: `Ticket #${ticketId.slice(0, 6).toUpperCase()} — ${result.data.subject}` };
}

function MessageBubble({
  message,
  isAdmin,
}: {
  message: TicketMessageWithUser;
  isAdmin: boolean;
}) {
  const initials = (message.userName ?? message.userEmail ?? "?")
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();

  return (
    <div className={`flex gap-3 ${isAdmin ? "flex-row-reverse" : "flex-row"}`}>
      <Avatar className="h-8 w-8 flex-shrink-0">
        <AvatarImage src={message.userImage ?? undefined} />
        <AvatarFallback className="text-xs">{initials}</AvatarFallback>
      </Avatar>
      <div
        className={`max-w-[75%] rounded-lg border p-3 text-sm ${
          isAdmin
            ? "bg-primary/5 border-primary/20"
            : "bg-muted border-border"
        }`}
      >
        <div className={`flex items-center gap-2 mb-1.5 flex-wrap ${isAdmin ? "justify-end" : ""}`}>
          <span className="font-medium text-xs">{message.userName ?? message.userEmail}</span>
          {message.userRole && (
            <RoleBadge role={message.userRole as Parameters<typeof RoleBadge>[0]["role"]} />
          )}
          <span className="text-xs text-muted-foreground">
            {format(new Date(message.createdAt), "dd/MM HH:mm", { locale: ptBR })}
          </span>
        </div>
        <p className="whitespace-pre-wrap leading-relaxed">{message.content}</p>
        {message.attachments && message.attachments.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {message.attachments.map((att) => (
              <span
                key={att}
                className="inline-flex items-center gap-1 text-xs text-muted-foreground border rounded px-1.5 py-0.5"
              >
                <Paperclip className="h-3 w-3" />
                {att}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default async function AdminTicketDetailPage({ params }: Props) {
  const { ticketId } = await params;
  const result = await getAdminTicketById(ticketId);

  if (!result.success) notFound();
  const ticket = result.data;

  return (
    <div className="p-6 space-y-4">
      {/* Back link */}
      <Link
        href="/admin/tickets"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Todos os tickets
      </Link>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-10">
        {/* ── Main column (70%) ── */}
        <div className="lg:col-span-7 space-y-4">
          {/* Subject */}
          <div>
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className="text-xs font-mono text-muted-foreground">
                #{ticketId.slice(0, 6).toUpperCase()}
              </span>
              <Badge variant="outline" className="text-xs">{ticket.type}</Badge>
            </div>
            <h2 className="text-xl font-semibold">{ticket.subject}</h2>
          </div>

          <Separator />

          {/* Message thread */}
          <div className="space-y-4">
            {ticket.messages.length === 0 ? (
              <p className="text-sm text-muted-foreground py-8 text-center">
                Nenhuma mensagem ainda. Seja o primeiro a responder.
              </p>
            ) : (
              ticket.messages.map((msg) => (
                <MessageBubble
                  key={msg.id}
                  message={msg}
                  isAdmin={msg.userRole === "SUPER_ADMIN"}
                />
              ))
            )}
          </div>

          {/* Reply form */}
          {ticket.status !== "CLOSED" && (
            <TicketReplyForm ticketId={ticketId} />
          )}
          {ticket.status === "CLOSED" && (
            <p className="text-sm text-center text-muted-foreground border rounded-lg py-3 bg-muted/50">
              Este ticket está fechado e não aceita mais respostas.
            </p>
          )}
        </div>

        {/* ── Sidebar (30%) ── */}
        <div className="lg:col-span-3 space-y-4">
          {/* Status & Actions */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold">Detalhes do Ticket</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <TicketStatusActions
                ticketId={ticketId}
                currentStatus={ticket.status}
                currentPriority={ticket.priority}
              />
              <Separator />
              <div className="space-y-2 text-xs text-muted-foreground">
                <div className="flex justify-between">
                  <span>ID</span>
                  <span className="font-mono">#{ticketId.slice(0, 6).toUpperCase()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Criado em</span>
                  <span>{format(new Date(ticket.createdAt), "dd/MM/yyyy HH:mm", { locale: ptBR })}</span>
                </div>
                <div className="flex justify-between">
                  <span>Atualizado em</span>
                  <span>{format(new Date(ticket.updatedAt), "dd/MM/yyyy HH:mm", { locale: ptBR })}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Agency */}
          {ticket.agency && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold">Agência</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <Link
                    href={`/admin/agencies/${ticket.agency.id}`}
                    className="font-medium hover:text-primary hover:underline"
                  >
                    {ticket.agency.name}
                  </Link>
                  <StatusBadge status={ticket.agency.agencyStatus} />
                </div>
                {ticket.plan && (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">Plano</span>
                    <PlanBadge plan={ticket.plan.slug ?? ticket.plan.name} />
                  </div>
                )}
                {(ticket.creatorName || ticket.creatorEmail) && (
                  <div className="pt-1 border-t text-xs text-muted-foreground">
                    <p className="font-medium text-foreground">
                      {ticket.creatorName ?? "Usuário desconhecido"}
                    </p>
                    <p>{ticket.creatorEmail}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
