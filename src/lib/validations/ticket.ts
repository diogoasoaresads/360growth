import { z } from "zod";

export const createTicketSchema = z.object({
  subject: z.string().min(5, "Assunto deve ter no mínimo 5 caracteres"),
  clientId: z.string().uuid("ID de cliente inválido"),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).default("MEDIUM"),
  type: z.enum(["SUPPORT", "FEATURE_REQUEST", "BUG", "BILLING", "OTHER"]).default("SUPPORT"),
  message: z.string().min(10, "Mensagem deve ter no mínimo 10 caracteres"),
});

export const updateTicketSchema = z.object({
  status: z.enum(["OPEN", "IN_PROGRESS", "WAITING", "RESOLVED", "CLOSED"]).optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).optional(),
  assignedTo: z.string().uuid().optional().nullable(),
});

export const addTicketMessageSchema = z.object({
  content: z.string().min(1, "Mensagem não pode estar vazia"),
  isInternal: z.boolean().default(false),
});

export type CreateTicketInput = z.infer<typeof createTicketSchema>;
export type UpdateTicketInput = z.infer<typeof updateTicketSchema>;
export type AddTicketMessageInput = z.infer<typeof addTicketMessageSchema>;
