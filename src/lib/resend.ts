import { Resend } from "resend";

// Lazy singleton — avoids throwing at module load time when key is absent (build env).
let _resend: Resend | null = null;
function getResend(): Resend {
  if (!_resend) {
    _resend = new Resend(process.env.RESEND_API_KEY ?? "");
  }
  return _resend;
}
/** @deprecated Use the helper functions below instead of accessing this directly. */
export const resend = { emails: { send: (...args: Parameters<Resend["emails"]["send"]>) => getResend().emails.send(...args) } } as unknown as Resend;

export async function sendWelcomeEmail(params: {
  to: string;
  name: string;
  agencyName: string;
}): Promise<void> {
  await resend.emails.send({
    from: process.env.EMAIL_FROM ?? "noreply@360growth.com",
    to: params.to,
    subject: `Bem-vindo ao 360growth, ${params.name}!`,
    html: `
      <h1>Bem-vindo ao 360growth!</h1>
      <p>Olá ${params.name},</p>
      <p>Sua agência <strong>${params.agencyName}</strong> foi criada com sucesso.</p>
      <p>Acesse sua conta e comece a gerenciar seus clientes.</p>
    `,
  });
}

export async function sendTicketCreatedEmail(params: {
  to: string;
  clientName: string;
  ticketSubject: string;
  ticketId: string;
}): Promise<void> {
  await resend.emails.send({
    from: process.env.EMAIL_FROM ?? "noreply@360growth.com",
    to: params.to,
    subject: `Ticket criado: ${params.ticketSubject}`,
    html: `
      <h1>Seu ticket foi criado</h1>
      <p>Olá ${params.clientName},</p>
      <p>Seu ticket <strong>"${params.ticketSubject}"</strong> foi criado com sucesso.</p>
      <p>ID do ticket: <code>${params.ticketId}</code></p>
      <p>Nossa equipe entrará em contato em breve.</p>
    `,
  });
}

export async function sendTicketReplyEmail(params: {
  to: string;
  clientName: string;
  ticketSubject: string;
  reply: string;
}): Promise<void> {
  await resend.emails.send({
    from: process.env.EMAIL_FROM ?? "noreply@360growth.com",
    to: params.to,
    subject: `Nova resposta: ${params.ticketSubject}`,
    html: `
      <h1>Nova resposta no seu ticket</h1>
      <p>Olá ${params.clientName},</p>
      <p>Você recebeu uma nova resposta no ticket <strong>"${params.ticketSubject}"</strong>:</p>
      <blockquote>${params.reply}</blockquote>
    `,
  });
}
