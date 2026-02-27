import { z } from "zod";

export const generalSettingsSchema = z.object({
  platformName: z.string().min(2).max(100),
  platformUrl: z.string().url("URL inválida").optional().or(z.literal("")),
  primaryColor: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/, "Cor inválida (ex: #6366f1)"),
  description: z.string().max(500).optional(),
});

export const emailSettingsSchema = z.object({
  senderEmail: z.string().email("Email inválido"),
  senderName: z.string().min(2).max(100),
});

export const limitsSettingsSchema = z.object({
  defaultTrialDays: z.number().int().min(0).max(90),
  maxUploadMb: z.number().int().min(50).max(10000),
  maxConcurrentSessions: z.number().int().min(1).max(10),
});

export const securitySettingsSchema = z.object({
  enforce2FA: z.boolean(),
  sessionExpirationHours: z.number().int().min(1).max(720),
  maxLoginAttempts: z.number().int().min(3).max(20),
  lockoutMinutes: z.number().int().min(5).max(1440),
});

export const maintenanceSettingsSchema = z.object({
  enabled: z.boolean(),
  message: z.string().max(500),
  estimatedReturn: z.string().optional(),
});

export type GeneralSettings = z.infer<typeof generalSettingsSchema>;
export type EmailSettings = z.infer<typeof emailSettingsSchema>;
export type LimitsSettings = z.infer<typeof limitsSettingsSchema>;
export type SecuritySettings = z.infer<typeof securitySettingsSchema>;
export type MaintenanceSettings = z.infer<typeof maintenanceSettingsSchema>;
