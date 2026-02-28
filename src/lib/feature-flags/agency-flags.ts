import "server-only";

import { db } from "@/lib/db";
import { featureFlags, agencyFeatureFlags } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

/** Static registry: defines known flags and their safe defaults. */
export const FLAG_REGISTRY: Record<
  string,
  { name: string; description: string; defaultEnabled: boolean }
> = {
  tickets_enabled: {
    name: "Tickets",
    description: "Módulo de tickets de suporte",
    defaultEnabled: true,
  },
  deals_enabled: {
    name: "Pipeline CRM",
    description: "Módulo de pipeline/deals",
    defaultEnabled: true,
  },
  clients_enabled: {
    name: "Clientes",
    description: "Módulo de gerenciamento de clientes",
    defaultEnabled: true,
  },
  billing_enabled: {
    name: "Faturamento",
    description: "Módulo de faturamento",
    defaultEnabled: false,
  },
};

export type FeatureFlagKey = keyof typeof FLAG_REGISTRY;

export interface ResolvedFlag {
  id: string | null;          // featureFlags.id (null = not in DB yet)
  key: string;
  name: string;
  description: string;
  globalEnabled: boolean;     // DB global state (or registry default)
  override: { id: string; enabled: boolean } | null;
  effectiveEnabled: boolean;  // resolved value (override ?? global)
}

/**
 * Returns all known flags (registry union DB) with their resolved states
 * for the given agency. DB global value overrides registry default;
 * agency override overrides DB global.
 */
export async function getEffectiveAgencyFlags(
  agencyId: string
): Promise<ResolvedFlag[]> {
  const [dbFlags, overrides] = await Promise.all([
    db.select().from(featureFlags),
    db
      .select({
        id: agencyFeatureFlags.id,
        flagId: agencyFeatureFlags.flagId,
        enabled: agencyFeatureFlags.enabled,
      })
      .from(agencyFeatureFlags)
      .where(eq(agencyFeatureFlags.agencyId, agencyId)),
  ]);

  const overrideByFlagId = new Map(overrides.map((o) => [o.flagId, o]));

  // Build a map of key → dbFlag
  const dbFlagByKey = new Map(dbFlags.map((f) => [f.key, f]));

  // Merge: all registry keys + any DB keys not in registry
  const allKeys = new Set([
    ...Object.keys(FLAG_REGISTRY),
    ...dbFlags.map((f) => f.key),
  ]);

  return Array.from(allKeys).map((key) => {
    const reg = FLAG_REGISTRY[key];
    const dbFlag = dbFlagByKey.get(key) ?? null;
    const override = dbFlag ? (overrideByFlagId.get(dbFlag.id) ?? null) : null;
    const globalEnabled = dbFlag ? dbFlag.enabled : (reg?.defaultEnabled ?? false);
    const effectiveEnabled = override !== null ? override.enabled : globalEnabled;

    return {
      id: dbFlag?.id ?? null,
      key,
      name: dbFlag?.name ?? reg?.name ?? key,
      description: dbFlag?.description ?? reg?.description ?? "",
      globalEnabled,
      override: override ? { id: override.id, enabled: override.enabled } : null,
      effectiveEnabled,
    };
  });
}

/**
 * Returns whether a specific feature is enabled for the agency.
 * Falls back to FLAG_REGISTRY default if the flag doesn't exist in DB.
 */
export async function isFeatureEnabled(
  agencyId: string,
  flagKey: string
): Promise<boolean> {
  // Single-flag fast path: join directly instead of loading all flags
  const [dbFlag] = await db
    .select({ id: featureFlags.id, enabled: featureFlags.enabled })
    .from(featureFlags)
    .where(eq(featureFlags.key, flagKey))
    .limit(1);

  if (!dbFlag) {
    return FLAG_REGISTRY[flagKey]?.defaultEnabled ?? false;
  }

  const [override] = await db
    .select({ enabled: agencyFeatureFlags.enabled })
    .from(agencyFeatureFlags)
    .where(
      and(
        eq(agencyFeatureFlags.agencyId, agencyId),
        eq(agencyFeatureFlags.flagId, dbFlag.id)
      )
    )
    .limit(1);

  return override !== undefined ? override.enabled : dbFlag.enabled;
}
