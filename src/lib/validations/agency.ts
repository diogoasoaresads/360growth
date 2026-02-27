import { z } from "zod";

export const createAgencySchema = z.object({
  name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  slug: z
    .string()
    .min(2, "Slug deve ter pelo menos 2 caracteres")
    .regex(
      /^[a-z0-9-]+$/,
      "Slug deve conter apenas letras minúsculas, números e hífens"
    ),
  email: z
    .string()
    .email("Email inválido")
    .optional()
    .or(z.literal(""))
    .nullable(),
  phone: z.string().optional().nullable(),
  planId: z.string().optional().nullable(),
  maxMembers: z.number().int().min(1),
  maxClients: z.number().int().min(1),
  website: z.string().url("URL inválida").optional().or(z.literal("")).nullable(),
});

export const updateAgencySchema = createAgencySchema.partial().extend({
  agencyStatus: z
    .enum(["active", "suspended", "trial", "cancelled"])
    .optional(),
});

export type CreateAgencyInput = z.infer<typeof createAgencySchema>;
export type UpdateAgencyInput = z.infer<typeof updateAgencySchema>;
