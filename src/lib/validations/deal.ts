import { z } from "zod";

export const createDealSchema = z.object({
  title: z.string().min(3, "Título deve ter no mínimo 3 caracteres"),
  clientId: z.string().uuid("ID de cliente inválido"),
  value: z.number().nonnegative("Valor deve ser positivo").optional(),
  stageId: z.string().optional(),
  responsibleId: z.string().uuid().optional(),
  expectedCloseDate: z.coerce.date().optional(),
  description: z.string().optional(),
  dealProbabilityDynamic: z.number().min(0).max(100).default(0),
});

export const updateDealSchema = createDealSchema.partial();
export const moveDealStageSchema = z.object({
  stageId: z.string(),
});

export type CreateDealInput = z.infer<typeof createDealSchema>;
export type UpdateDealInput = z.infer<typeof updateDealSchema>;
export type MoveDealStageInput = z.infer<typeof moveDealStageSchema>;
