import { z } from "zod";

const keyRegex = /^[a-z0-9._-]+$/;

export const settingTypeSchema = z.enum(["string", "number", "boolean", "json"]);

export const createPlatformSettingSchema = z.object({
  key: z
    .string()
    .min(1, "Chave obrigatória")
    .max(200)
    .regex(keyRegex, "Apenas letras minúsculas, números, ponto, hífen ou underscore"),
  value: z.string(),
  type: settingTypeSchema,
  description: z.string().max(500).optional(),
  isSecret: z.boolean().default(false),
});

export const updatePlatformSettingSchema = z.object({
  value: z.string(),
  type: settingTypeSchema,
  description: z.string().max(500).optional(),
  isSecret: z.boolean(),
});

export const createFeatureFlagSchema = z.object({
  key: z
    .string()
    .min(1, "Chave obrigatória")
    .max(200)
    .regex(keyRegex, "Apenas letras minúsculas, números, ponto, hífen ou underscore"),
  name: z.string().min(1, "Nome obrigatório").max(100),
  description: z.string().max(500).optional(),
  enabled: z.boolean().default(false),
  rolloutPercent: z.number().int().min(0).max(100).default(100),
});

export const updateFeatureFlagSchema = z.object({
  name: z.string().min(1, "Nome obrigatório").max(100),
  description: z.string().max(500).optional(),
  enabled: z.boolean(),
  rolloutPercent: z.number().int().min(0).max(100),
});

export type CreatePlatformSettingInput = z.infer<typeof createPlatformSettingSchema>;
export type UpdatePlatformSettingInput = z.infer<typeof updatePlatformSettingSchema>;
export type CreateFeatureFlagInput = z.infer<typeof createFeatureFlagSchema>;
export type UpdateFeatureFlagInput = z.infer<typeof updateFeatureFlagSchema>;
