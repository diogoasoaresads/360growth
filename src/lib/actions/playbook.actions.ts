"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { stagePlaybooks, deals } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getActiveAgencyIdOrThrow } from "@/lib/active-context";

export async function getPlaybookByStage(stageId: string) {
    return await db.query.stagePlaybooks.findFirst({
        where: eq(stagePlaybooks.stageId, stageId),
    });
}

export async function savePlaybook(data: typeof stagePlaybooks.$inferInsert) {
    const session = await auth();
    if (!session) throw new Error("Unauthorized");

    const existing = await db.query.stagePlaybooks.findFirst({
        where: eq(stagePlaybooks.stageId, data.stageId),
    });

    if (existing) {
        await db.update(stagePlaybooks)
            .set({ ...data, updatedAt: new Date() })
            .where(eq(stagePlaybooks.id, existing.id));
    } else {
        await db.insert(stagePlaybooks).values(data);
    }

    revalidatePath("/agency/crm/pipeline");
}

export async function updateDealChecklist(dealId: string, checklistProgress: Record<string, boolean>) {
    const session = await auth();
    if (!session) throw new Error("Unauthorized");
    const agencyId = await getActiveAgencyIdOrThrow();

    await db.update(deals)
        .set({ checklistProgress, updatedAt: new Date() })
        .where(and(eq(deals.id, dealId), eq(deals.agencyId, agencyId)));

    revalidatePath("/agency/crm/pipeline");
}
