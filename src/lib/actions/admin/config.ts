"use server";

import { db } from "@/lib/db";
import {
  platformSettings,
  featureFlags,
  agencyFeatureFlags,
  agencies,
  auditLogs,
  users,
} from "@/lib/db/schema";
import { auth } from "@/lib/auth";
import { eq, asc, desc, count, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import type { ActionResult } from "@/lib/types";
import { createAuditLog, getRequestMeta } from "@/lib/audit-log";
import {
  createPlatformSettingSchema,
  updatePlatformSettingSchema,
  createFeatureFlagSchema,
  updateFeatureFlagSchema,
  type CreatePlatformSettingInput,
  type UpdatePlatformSettingInput,
  type CreateFeatureFlagInput,
  type UpdateFeatureFlagInput,
} from "@/lib/validations/config";
import type { SettingType } from "@/lib/db/schema";

async function requireSuperAdmin() {
  const session = await auth();
  if (!session || session.user.role !== "SUPER_ADMIN") {
    throw new Error("Não autorizado");
  }
  return session;
}

function validateValueByType(value: string, type: SettingType): string | null {
  if (type === "number") {
    const n = Number(value);
    if (value.trim() === "" || isNaN(n) || !isFinite(n)) {
      return "Valor deve ser um número válido";
    }
  } else if (type === "boolean") {
    if (value !== "true" && value !== "false") {
      return 'Valor deve ser "true" ou "false"';
    }
  } else if (type === "json") {
    try {
      JSON.parse(value);
    } catch {
      return "Valor deve ser JSON válido";
    }
  }
  return null;
}

// ============================================================
// PLATFORM SETTINGS
// ============================================================

export interface PlatformSettingRow {
  key: string;
  value: string;
  type: SettingType;
  description: string | null;
  isSecret: boolean;
  updatedAt: Date;
  updatedBy: string | null;
  updatedByName: string | null;
}

export async function getPlatformSettings(): Promise<ActionResult<PlatformSettingRow[]>> {
  try {
    await requireSuperAdmin();
    const rows = await db
      .select({
        key: platformSettings.key,
        value: platformSettings.value,
        type: platformSettings.type,
        description: platformSettings.description,
        isSecret: platformSettings.isSecret,
        updatedAt: platformSettings.updatedAt,
        updatedBy: platformSettings.updatedBy,
        updatedByName: users.name,
      })
      .from(platformSettings)
      .leftJoin(users, eq(users.id, platformSettings.updatedBy))
      .orderBy(asc(platformSettings.key));

    // Mask secret values before returning to client
    return {
      success: true,
      data: rows.map((r) => ({
        ...r,
        value: r.isSecret ? "•••••" : r.value,
      })),
    };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Erro ao carregar" };
  }
}

export async function createPlatformSetting(
  input: CreatePlatformSettingInput
): Promise<ActionResult<void>> {
  try {
    const session = await requireSuperAdmin();
    const parsed = createPlatformSettingSchema.safeParse(input);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos" };
    }

    const valueError = validateValueByType(parsed.data.value, parsed.data.type);
    if (valueError) return { success: false, error: valueError };

    await db.insert(platformSettings).values({
      key: parsed.data.key,
      value: parsed.data.value,
      type: parsed.data.type,
      description: parsed.data.description ?? null,
      isSecret: parsed.data.isSecret,
      updatedBy: session.user.id,
    });

    const meta = await getRequestMeta();
    await createAuditLog({
      userId: session.user.id,
      action: "platform_setting.created",
      resourceType: "PLATFORM_SETTING",
      resourceId: parsed.data.key,
      details: { key: parsed.data.key, type: parsed.data.type, isSecret: parsed.data.isSecret },
      ...meta,
    });

    revalidatePath("/admin/config");
    return { success: true, data: undefined };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "";
    if (msg.includes("23505") || msg.includes("duplicate")) {
      return { success: false, error: "Já existe uma configuração com esta chave" };
    }
    return { success: false, error: msg || "Erro ao criar configuração" };
  }
}

export async function updatePlatformSetting(
  key: string,
  input: UpdatePlatformSettingInput
): Promise<ActionResult<void>> {
  try {
    const session = await requireSuperAdmin();
    const parsed = updatePlatformSettingSchema.safeParse(input);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos" };
    }

    // If value is empty and it's a secret, we allow skipping the update of value
    const skipValueUpdate = parsed.data.isSecret && parsed.data.value === "";

    if (!skipValueUpdate) {
      const valueError = validateValueByType(parsed.data.value, parsed.data.type);
      if (valueError) return { success: false, error: valueError };
    }

    const [before] = await db
      .select()
      .from(platformSettings)
      .where(eq(platformSettings.key, key));
    if (!before) return { success: false, error: "Configuração não encontrada" };

    await db
      .update(platformSettings)
      .set({
        value: skipValueUpdate ? before.value : parsed.data.value,
        type: parsed.data.type,
        description: parsed.data.description ?? null,
        isSecret: parsed.data.isSecret,
        updatedAt: new Date(),
        updatedBy: session.user.id,
      })
      .where(eq(platformSettings.key, key));

    const meta = await getRequestMeta();
    await createAuditLog({
      userId: session.user.id,
      action: "platform_setting.updated",
      resourceType: "PLATFORM_SETTING",
      resourceId: key,
      details: {
        key,
        before: { value: before.isSecret ? "***" : before.value, type: before.type },
        after: {
          value: parsed.data.isSecret ? "***" : (skipValueUpdate ? before.value : parsed.data.value),
          type: parsed.data.type,
        },
      },
      ...meta,
    });

    revalidatePath("/admin/config");
    return { success: true, data: undefined };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Erro ao atualizar" };
  }
}

export async function deletePlatformSetting(key: string): Promise<ActionResult<void>> {
  try {
    const session = await requireSuperAdmin();

    await db.delete(platformSettings).where(eq(platformSettings.key, key));

    const meta = await getRequestMeta();
    await createAuditLog({
      userId: session.user.id,
      action: "platform_setting.deleted",
      resourceType: "PLATFORM_SETTING",
      resourceId: key,
      details: { key },
      ...meta,
    });

    revalidatePath("/admin/config");
    return { success: true, data: undefined };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Erro ao deletar" };
  }
}

// ============================================================
// FEATURE FLAGS
// ============================================================

export interface FeatureFlagRow {
  id: string;
  key: string;
  name: string;
  description: string | null;
  enabled: boolean;
  rolloutPercent: number;
  createdAt: Date;
  updatedAt: Date;
  updatedByName: string | null;
  overrideCount: number;
}

export interface AgencyOverrideRow {
  id: string;
  agencyId: string;
  agencyName: string;
  enabled: boolean;
  updatedAt: Date;
}

export async function getFeatureFlags(): Promise<ActionResult<FeatureFlagRow[]>> {
  try {
    await requireSuperAdmin();
    const rows = await db
      .select({
        id: featureFlags.id,
        key: featureFlags.key,
        name: featureFlags.name,
        description: featureFlags.description,
        enabled: featureFlags.enabled,
        rolloutPercent: featureFlags.rolloutPercent,
        createdAt: featureFlags.createdAt,
        updatedAt: featureFlags.updatedAt,
        updatedByName: users.name,
      })
      .from(featureFlags)
      .leftJoin(users, eq(users.id, featureFlags.updatedBy))
      .orderBy(asc(featureFlags.key));

    const flagIds = rows.map((r) => r.id);
    let overrideCounts: Record<string, number> = {};

    if (flagIds.length > 0) {
      const counts = await db
        .select({ flagId: agencyFeatureFlags.flagId, cnt: count() })
        .from(agencyFeatureFlags)
        .where(inArray(agencyFeatureFlags.flagId, flagIds))
        .groupBy(agencyFeatureFlags.flagId);

      overrideCounts = Object.fromEntries(counts.map((c) => [c.flagId, Number(c.cnt)]));
    }

    return {
      success: true,
      data: rows.map((r) => ({ ...r, overrideCount: overrideCounts[r.id] ?? 0 })),
    };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Erro ao carregar flags" };
  }
}

export async function getAgencyOverridesForFlag(
  flagId: string
): Promise<ActionResult<AgencyOverrideRow[]>> {
  try {
    await requireSuperAdmin();
    const rows = await db
      .select({
        id: agencyFeatureFlags.id,
        agencyId: agencyFeatureFlags.agencyId,
        agencyName: agencies.name,
        enabled: agencyFeatureFlags.enabled,
        updatedAt: agencyFeatureFlags.updatedAt,
      })
      .from(agencyFeatureFlags)
      .innerJoin(agencies, eq(agencies.id, agencyFeatureFlags.agencyId))
      .where(eq(agencyFeatureFlags.flagId, flagId))
      .orderBy(asc(agencies.name));

    return { success: true, data: rows };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Erro ao carregar overrides" };
  }
}

export async function createFeatureFlag(input: CreateFeatureFlagInput): Promise<ActionResult<void>> {
  try {
    const session = await requireSuperAdmin();
    const parsed = createFeatureFlagSchema.safeParse(input);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos" };
    }

    await db.insert(featureFlags).values({
      key: parsed.data.key,
      name: parsed.data.name,
      description: parsed.data.description ?? null,
      enabled: parsed.data.enabled,
      rolloutPercent: parsed.data.rolloutPercent,
      updatedBy: session.user.id,
    });

    const meta = await getRequestMeta();
    await createAuditLog({
      userId: session.user.id,
      action: "feature_flag.created",
      resourceType: "FEATURE_FLAG",
      resourceId: parsed.data.key,
      details: { key: parsed.data.key, enabled: parsed.data.enabled },
      ...meta,
    });

    revalidatePath("/admin/config");
    return { success: true, data: undefined };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "";
    if (msg.includes("23505") || msg.includes("duplicate")) {
      return { success: false, error: "Já existe uma flag com esta chave" };
    }
    return { success: false, error: msg || "Erro ao criar flag" };
  }
}

export async function updateFeatureFlag(
  id: string,
  input: UpdateFeatureFlagInput
): Promise<ActionResult<void>> {
  try {
    const session = await requireSuperAdmin();
    const parsed = updateFeatureFlagSchema.safeParse(input);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos" };
    }

    const [before] = await db.select().from(featureFlags).where(eq(featureFlags.id, id));
    if (!before) return { success: false, error: "Flag não encontrada" };

    await db
      .update(featureFlags)
      .set({
        name: parsed.data.name,
        description: parsed.data.description ?? null,
        enabled: parsed.data.enabled,
        rolloutPercent: parsed.data.rolloutPercent,
        updatedAt: new Date(),
        updatedBy: session.user.id,
      })
      .where(eq(featureFlags.id, id));

    const meta = await getRequestMeta();
    await createAuditLog({
      userId: session.user.id,
      action: "feature_flag.updated",
      resourceType: "FEATURE_FLAG",
      resourceId: before.key,
      details: {
        key: before.key,
        before: { enabled: before.enabled, rolloutPercent: before.rolloutPercent },
        after: { enabled: parsed.data.enabled, rolloutPercent: parsed.data.rolloutPercent },
      },
      ...meta,
    });

    revalidatePath("/admin/config");
    return { success: true, data: undefined };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Erro ao atualizar flag" };
  }
}

export async function deleteFeatureFlag(id: string): Promise<ActionResult<void>> {
  try {
    const session = await requireSuperAdmin();

    const [flag] = await db.select().from(featureFlags).where(eq(featureFlags.id, id));
    if (!flag) return { success: false, error: "Flag não encontrada" };

    await db.delete(featureFlags).where(eq(featureFlags.id, id));

    const meta = await getRequestMeta();
    await createAuditLog({
      userId: session.user.id,
      action: "feature_flag.deleted",
      resourceType: "FEATURE_FLAG",
      resourceId: flag.key,
      details: { key: flag.key },
      ...meta,
    });

    revalidatePath("/admin/config");
    return { success: true, data: undefined };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Erro ao deletar flag" };
  }
}

// ============================================================
// CONFIG AUDIT LOGS (last 50 config-related actions)
// ============================================================

const CONFIG_ACTIONS = [
  "platform_setting.created",
  "platform_setting.updated",
  "platform_setting.deleted",
  "feature_flag.created",
  "feature_flag.updated",
  "feature_flag.deleted",
  "feature_flag.override_set",
  "settings.updated",
];

export interface ConfigAuditLogEntry {
  id: string;
  action: string;
  entityId: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: Date;
  userName: string | null;
  userEmail: string | null;
}

export async function getConfigAuditLogs(): Promise<ActionResult<ConfigAuditLogEntry[]>> {
  try {
    await requireSuperAdmin();
    const rows = await db
      .select({
        id: auditLogs.id,
        action: auditLogs.action,
        entityId: auditLogs.entityId,
        metadata: auditLogs.metadata,
        createdAt: auditLogs.createdAt,
        userName: users.name,
        userEmail: users.email,
      })
      .from(auditLogs)
      .leftJoin(users, eq(users.id, auditLogs.userId))
      .where(inArray(auditLogs.action, CONFIG_ACTIONS))
      .orderBy(desc(auditLogs.createdAt))
      .limit(50);

    return {
      success: true,
      data: rows.map((r) => ({
        ...r,
        metadata: r.metadata as Record<string, unknown> | null,
      })),
    };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Erro ao buscar logs" };
  }
}
