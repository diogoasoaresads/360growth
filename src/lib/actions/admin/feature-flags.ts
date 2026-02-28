"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { featureFlags, agencyFeatureFlags } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { createAuditLog } from "@/lib/audit-log";
import { FLAG_REGISTRY } from "@/lib/feature-flags/agency-flags";

async function requireSuperAdmin() {
  const session = await auth();
  if (!session || session.user.role !== "SUPER_ADMIN") {
    throw new Error("Não autorizado");
  }
  return session;
}

/** Upsert an agency-level override for a feature flag. */
export async function setAgencyFeatureFlagOverride(params: {
  agencyId: string;
  flagKey: string;
  enabled: boolean;
}): Promise<{ success: true } | { success: false; error: string }> {
  try {
    const session = await requireSuperAdmin();
    const { agencyId, flagKey, enabled } = params;

    // Ensure the global flag record exists (auto-create from registry if needed)
    let [flag] = await db
      .select({ id: featureFlags.id, enabled: featureFlags.enabled })
      .from(featureFlags)
      .where(eq(featureFlags.key, flagKey))
      .limit(1);

    if (!flag) {
      const reg = FLAG_REGISTRY[flagKey];
      if (!reg) return { success: false, error: `Flag desconhecida: ${flagKey}` };

      const [created] = await db
        .insert(featureFlags)
        .values({
          key: flagKey,
          name: reg.name,
          description: reg.description,
          enabled: reg.defaultEnabled,
        })
        .returning({ id: featureFlags.id, enabled: featureFlags.enabled });
      flag = created;
    }

    // Read current override for audit before/after
    const [existing] = await db
      .select({ enabled: agencyFeatureFlags.enabled })
      .from(agencyFeatureFlags)
      .where(
        and(
          eq(agencyFeatureFlags.agencyId, agencyId),
          eq(agencyFeatureFlags.flagId, flag.id)
        )
      )
      .limit(1);

    const before = existing?.enabled ?? null;

    await db
      .insert(agencyFeatureFlags)
      .values({ agencyId, flagId: flag.id, enabled, updatedBy: session.user.id })
      .onConflictDoUpdate({
        target: [agencyFeatureFlags.agencyId, agencyFeatureFlags.flagId],
        set: { enabled, updatedAt: new Date(), updatedBy: session.user.id },
      });

    await createAuditLog({
      userId: session.user.id,
      action: "feature_flag.override_set",
      agencyId,
      details: { flagKey, before, after: enabled },
    });

    revalidatePath(`/admin/agencies/${agencyId}`);
    return { success: true };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Erro ao salvar override",
    };
  }
}

/** Remove an agency-level override (reverts to global). */
export async function clearAgencyFeatureFlagOverride(params: {
  agencyId: string;
  flagKey: string;
}): Promise<{ success: true } | { success: false; error: string }> {
  try {
    const session = await requireSuperAdmin();
    const { agencyId, flagKey } = params;

    const [flag] = await db
      .select({ id: featureFlags.id })
      .from(featureFlags)
      .where(eq(featureFlags.key, flagKey))
      .limit(1);

    if (!flag) return { success: true }; // Nothing to clear

    const [existing] = await db
      .select({ enabled: agencyFeatureFlags.enabled })
      .from(agencyFeatureFlags)
      .where(
        and(
          eq(agencyFeatureFlags.agencyId, agencyId),
          eq(agencyFeatureFlags.flagId, flag.id)
        )
      )
      .limit(1);

    if (existing) {
      await db
        .delete(agencyFeatureFlags)
        .where(
          and(
            eq(agencyFeatureFlags.agencyId, agencyId),
            eq(agencyFeatureFlags.flagId, flag.id)
          )
        );

      await createAuditLog({
        userId: session.user.id,
        action: "feature_flag.override_set",
        agencyId,
        details: { flagKey, before: existing.enabled, after: null },
      });
    }

    revalidatePath(`/admin/agencies/${agencyId}`);
    return { success: true };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Erro ao remover override",
    };
  }
}
