"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { deals, activities } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getActiveAgencyIdOrThrow } from "@/lib/active-context";
import type { DealStage } from "@/lib/db/schema";
import { processWorkflowEvent } from "../automation/workflow-engine";

/**
 * Update the stage of a deal
 */
export async function updateDealStage(dealId: string, stage: DealStage) {
  const session = await auth();
  if (!session) throw new Error("Unauthorized");

  const agencyId = await getActiveAgencyIdOrThrow();

  const [deal] = await db
    .update(deals)
    .set({
      stage,
      updatedAt: new Date()
    })
    .where(and(eq(deals.id, dealId), eq(deals.agencyId, agencyId)))
    .returning();

  if (deal) {
    await db.insert(activities).values({
      agencyId,
      entityType: "DEAL",
      entityId: dealId,
      userId: session.user.id,
      type: "STATUS_CHANGE",
      description: `Estágio do negócio alterado para: ${stage}`,
    });

    // Trigger Automations
    await processWorkflowEvent(agencyId, "DEAL_STAGE_CHANGED", {
      entityId: dealId,
      entityType: "DEAL",
      currentValue: stage,
    });
  }

  revalidatePath("/agency/crm/pipeline");
  revalidatePath("/agency/dashboard");
  return deal;
}

/**
 * Update deal information
 */
export async function updateDeal(id: string, data: Partial<typeof deals.$inferInsert>) {
  const session = await auth();
  if (!session) throw new Error("Unauthorized");

  const agencyId = await getActiveAgencyIdOrThrow();

  const [deal] = await db
    .update(deals)
    .set({
      ...data,
      updatedAt: new Date(),
    })
    .where(and(eq(deals.id, id), eq(deals.agencyId, agencyId)))
    .returning();

  revalidatePath("/agency/crm/pipeline");
  return deal;
}
