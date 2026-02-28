import { z } from "zod";

export const planLimitsSchema = z.object({
  maxUsers: z.number().int().min(0, "Use 0 para ilimitado"),
  maxClients: z.number().int().min(0, "Use 0 para ilimitado"),
  maxDeals: z.number().int().min(0, "Use 0 para ilimitado"),
  maxTickets: z.number().int().min(0, "Use 0 para ilimitado"),
});

export type PlanLimitsInput = z.infer<typeof planLimitsSchema>;

export const updatePlanSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  slug: z.string().min(1).optional(),
  description: z.string().optional().nullable(),
  priceMonthly: z.number().min(0, "Preço inválido"),
  priceYearly: z.number().min(0, "Preço inválido"),
  maxClients: z.number().int().min(1, "Mínimo de 1 cliente"),
  maxUsers: z.number().int().min(1, "Mínimo de 1 usuário"),
  isActive: z.boolean(),
  sortOrder: z.number().int().min(0),
  featuresConfig: z
    .object({
      maxMembers: z.number().int().min(0),
      maxClients: z.number().int().min(0),
      maxPipelines: z.number().int().min(0),
      maxTicketsMonth: z.number().int().min(0),
      customDomain: z.boolean(),
      apiAccess: z.boolean(),
      prioritySupport: z.boolean(),
      whiteLabel: z.boolean(),
      advancedReports: z.boolean(),
    })
    .optional()
    .nullable(),
  features: z.array(z.string()).optional().nullable(),
  stripePriceId: z.string().optional().nullable(),
  stripePriceIdYearly: z.string().optional().nullable(),
  limits: planLimitsSchema.optional().nullable(),
});

export type UpdatePlanInput = z.infer<typeof updatePlanSchema>;
