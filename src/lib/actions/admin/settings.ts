"use server";

import { db } from "@/lib/db";
import { platformSettings } from "@/lib/db/schema";
import { auth } from "@/lib/auth";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import type { ActionResult } from "@/lib/types";
import { createAuditLog } from "@/lib/audit-log";
import {
  generalSettingsSchema,
  emailSettingsSchema,
  limitsSettingsSchema,
  securitySettingsSchema,
  maintenanceSettingsSchema,
  type GeneralSettings,
  type EmailSettings,
  type LimitsSettings,
  type SecuritySettings,
  type MaintenanceSettings,
} from "@/lib/validations/settings";

async function requireSuperAdmin() {
  const session = await auth();
  if (!session || session.user.role !== "SUPER_ADMIN") {
    throw new Error("Não autorizado");
  }
  return session;
}

// Default values for each setting key
const SETTING_DEFAULTS: Record<string, unknown> = {
  "general.platformName": "360growth",
  "general.platformUrl": "",
  "general.primaryColor": "#6366f1",
  "general.description": "",
  "email.senderEmail": "noreply@360growth.com",
  "email.senderName": "360growth",
  "limits.defaultTrialDays": 14,
  "limits.maxUploadMb": 500,
  "limits.maxConcurrentSessions": 3,
  "security.enforce2FA": false,
  "security.sessionExpirationHours": 24,
  "security.maxLoginAttempts": 5,
  "security.lockoutMinutes": 30,
  "maintenance.enabled": false,
  "maintenance.message": "Estamos em manutenção. Voltaremos em breve.",
  "maintenance.estimatedReturn": "",
};

export interface AllSettings {
  general: GeneralSettings;
  email: EmailSettings;
  limits: LimitsSettings;
  security: SecuritySettings;
  maintenance: MaintenanceSettings;
}

function parseValue(raw: string): unknown {
  try {
    return JSON.parse(raw);
  } catch {
    return raw;
  }
}

export async function getSettings(): Promise<ActionResult<AllSettings>> {
  try {
    await requireSuperAdmin();

    const rows = await db.select().from(platformSettings);

    // Build map from DB values
    const dbMap = new Map<string, unknown>(
      rows.map((r) => [r.key, parseValue(r.value)])
    );

    // Merge with defaults
    const get = (key: string) => dbMap.get(key) ?? SETTING_DEFAULTS[key];

    return {
      success: true,
      data: {
        general: {
          platformName: String(get("general.platformName")),
          platformUrl: String(get("general.platformUrl") ?? ""),
          primaryColor: String(get("general.primaryColor")),
          description: String(get("general.description") ?? ""),
        },
        email: {
          senderEmail: String(get("email.senderEmail")),
          senderName: String(get("email.senderName")),
        },
        limits: {
          defaultTrialDays: Number(get("limits.defaultTrialDays")),
          maxUploadMb: Number(get("limits.maxUploadMb")),
          maxConcurrentSessions: Number(get("limits.maxConcurrentSessions")),
        },
        security: {
          enforce2FA: Boolean(get("security.enforce2FA")),
          sessionExpirationHours: Number(get("security.sessionExpirationHours")),
          maxLoginAttempts: Number(get("security.maxLoginAttempts")),
          lockoutMinutes: Number(get("security.lockoutMinutes")),
        },
        maintenance: {
          enabled: Boolean(get("maintenance.enabled")),
          message: String(get("maintenance.message")),
          estimatedReturn: String(get("maintenance.estimatedReturn") ?? ""),
        },
      },
    };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Erro ao carregar configurações" };
  }
}

type SectionData =
  | { section: "general"; data: GeneralSettings }
  | { section: "email"; data: EmailSettings }
  | { section: "limits"; data: LimitsSettings }
  | { section: "security"; data: SecuritySettings }
  | { section: "maintenance"; data: MaintenanceSettings };

export async function updateSettings(
  input: SectionData
): Promise<ActionResult<void>> {
  try {
    const session = await requireSuperAdmin();

    // Validate by section
    let parsed: Record<string, unknown>;
    const { section, data } = input;

    if (section === "general") {
      const result = generalSettingsSchema.safeParse(data);
      if (!result.success) return { success: false, error: result.error.issues[0]?.message ?? "Dados inválidos" };
      parsed = result.data as Record<string, unknown>;
    } else if (section === "email") {
      const result = emailSettingsSchema.safeParse(data);
      if (!result.success) return { success: false, error: result.error.issues[0]?.message ?? "Dados inválidos" };
      parsed = result.data as Record<string, unknown>;
    } else if (section === "limits") {
      const result = limitsSettingsSchema.safeParse(data);
      if (!result.success) return { success: false, error: result.error.issues[0]?.message ?? "Dados inválidos" };
      parsed = result.data as Record<string, unknown>;
    } else if (section === "security") {
      const result = securitySettingsSchema.safeParse(data);
      if (!result.success) return { success: false, error: result.error.issues[0]?.message ?? "Dados inválidos" };
      parsed = result.data as Record<string, unknown>;
    } else {
      const result = maintenanceSettingsSchema.safeParse(data);
      if (!result.success) return { success: false, error: result.error.issues[0]?.message ?? "Dados inválidos" };
      parsed = result.data as Record<string, unknown>;
    }

    // Upsert each key
    const now = new Date();
    for (const [field, value] of Object.entries(parsed)) {
      const key = `${section}.${field}`;
      await db
        .insert(platformSettings)
        .values({ key, value: JSON.stringify(value), updatedAt: now, updatedBy: session.user.id })
        .onConflictDoUpdate({
          target: platformSettings.key,
          set: { value: JSON.stringify(value), updatedAt: now, updatedBy: session.user.id },
        });
    }

    await createAuditLog({
      userId: session.user.id,
      action: "settings.updated",
      details: { section, fields: Object.keys(parsed) },
    });

    revalidatePath("/admin/settings");
    return { success: true, data: undefined };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Erro ao salvar configurações" };
  }
}

export async function getMaintenanceMode(): Promise<boolean> {
  try {
    const [row] = await db
      .select({ value: platformSettings.value })
      .from(platformSettings)
      .where(eq(platformSettings.key, "maintenance.enabled"));
    if (!row) return false;
    return parseValue(row.value) === true;
  } catch {
    return false;
  }
}
