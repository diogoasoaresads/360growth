"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { deals, activities, dealStageHistory, pipelineStages } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getActiveAgencyIdOrThrow } from "@/lib/active-context";
import { processWorkflowEvent } from "../automation/workflow-engine";

/**
 * Create a new deal
 */
export async function createDeal(data: typeof deals.$inferInsert) {
  const session = await auth();
  if (!session) throw new Error("Unauthorized");

  const agencyId = await getActiveAgencyIdOrThrow();

  const [deal] = await db.insert(deals).values({
    ...data,
    agencyId,
    createdAt: new Date(),
    updatedAt: new Date(),
  }).returning();

  if (deal) {
    await db.insert(activities).values({
      agencyId,
      entityType: "DEAL",
      entityId: deal.id,
      userId: session.user.id,
      type: "NOTE",
      description: "Negócio criado",
    });
  }

  revalidatePath("/agency/crm/pipeline");
  return deal;
}

/**
 * Update the stage of a deal (Kanban Move)
 */
export async function updateDealStage(dealId: string, stageId: string) {
  const session = await auth();
  if (!session) throw new Error("Unauthorized");

  const agencyId = await getActiveAgencyIdOrThrow();

  // Get current deal state to track history
  const currentDeal = await db.query.deals.findFirst({
    where: and(eq(deals.id, dealId), eq(deals.agencyId, agencyId)),
  });

  if (!currentDeal) throw new Error("Deal not found");

  const [deal] = await db
    .update(deals)
    .set({
      stageId,
      lastActivityAt: new Date(),
      updatedAt: new Date()
    })
    .where(and(eq(deals.id, dealId), eq(deals.agencyId, agencyId)))
    .returning();

  if (deal) {
    // Record history for Pipeline Velocity
    await db.insert(dealStageHistory).values({
      dealId,
      fromStageId: currentDeal.stageId,
      toStageId: stageId,
      movedBy: session.user.id,
    });

    // Record activity
    const stage = await db.query.pipelineStages.findFirst({
      where: eq(pipelineStages.id, stageId)
    });

    await db.insert(activities).values({
      agencyId,
      entityType: "DEAL",
      entityId: dealId,
      userId: session.user.id,
      type: "STATUS_CHANGE",
      description: `Negócio movido para: ${stage?.name || 'Novo Estágio'}`,
    });

    // Handle Closed States
    if (stage?.isClosedWon || stage?.isClosedLost) {
      await db.update(deals).set({
        status: stage.isClosedWon ? "WON" : "LOST",
        closedAt: new Date(),
      }).where(eq(deals.id, dealId));
    }

    // Trigger Automations
    await processWorkflowEvent(agencyId, "DEAL_STAGE_CHANGED", {
      entityId: dealId,
      entityType: "DEAL",
      currentValue: stageId,
    });
  }

  revalidatePath("/agency/crm/pipeline");
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
