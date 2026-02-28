"use server";

import { db } from "@/lib/db";
import { plans } from "@/lib/db/schema";
import { auth } from "@/lib/auth";
import { eq, asc } from "drizzle-orm";
import type { ActionResult } from "@/lib/types";
import type { Plan } from "@/lib/db/schema";
import { updatePlanSchema, type UpdatePlanInput } from "@/lib/validations/plan";
import { revalidatePath } from "next/cache";
import { createAuditLog } from "@/lib/audit-log";

async function requireSuperAdmin() {
  const session = await auth();
  if (!session || session.user.role !== "SUPER_ADMIN") {
    throw new Error("Não autorizado");
  }
  return session;
}

export async function getPlans(): Promise<ActionResult<Plan[]>> {
  try {
    await requireSuperAdmin();
    const data = await db
      .select()
      .from(plans)
      .orderBy(asc(plans.sortOrder), asc(plans.name));
    return { success: true, data };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Erro ao buscar planos",
    };
  }
}

export async function getPlanById(planId: string): Promise<ActionResult<Plan>> {
  try {
    await requireSuperAdmin();
    const [plan] = await db.select().from(plans).where(eq(plans.id, planId));
    if (!plan) return { success: false, error: "Plano não encontrado" };
    return { success: true, data: plan };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Erro ao buscar plano",
    };
  }
}

export async function updatePlan(
  planId: string,
  input: UpdatePlanInput
): Promise<ActionResult<Plan>> {
  try {
    const session = await requireSuperAdmin();
    const parsed = updatePlanSchema.safeParse(input);
    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.issues[0]?.message ?? "Dados inválidos",
      };
    }

    const { priceMonthly, priceYearly, limits, ...rest } = parsed.data;

    const [updated] = await db
      .update(plans)
      .set({
        ...rest,
        priceMonthly: String(priceMonthly),
        priceYearly: String(priceYearly),
        limits: limits ?? null,
        updatedAt: new Date(),
      })
      .where(eq(plans.id, planId))
      .returning();

    if (!updated) return { success: false, error: "Plano não encontrado" };

    await createAuditLog({
      userId: session.user.id,
      action: "plan.updated",
      resourceType: "PLAN",
      resourceId: planId,
      details: { changes: rest },
    });

    revalidatePath("/admin/plans");
    revalidatePath(`/admin/plans/${planId}`);
    return { success: true, data: updated };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Erro ao atualizar plano",
    };
  }
}
