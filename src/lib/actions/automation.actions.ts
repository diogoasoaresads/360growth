"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { automationWorkflows, tasks, agencyUsers, users as usersTable } from "@/lib/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getActiveAgencyIdOrThrow } from "@/lib/active-context";
import type { NewAutomationWorkflow, TaskStatus } from "@/lib/db/schema";

/**
 * UTILS
 */

export async function getAgencyUsers() {
    const agencyId = await getActiveAgencyIdOrThrow();
    return await db
        .select({
            id: usersTable.id,
            name: usersTable.name,
            email: usersTable.email,
        })
        .from(usersTable)
        .innerJoin(agencyUsers, eq(usersTable.id, agencyUsers.userId))
        .where(eq(agencyUsers.agencyId, agencyId));
}

/**
 * WORKFLOWS
 */

export async function getWorkflows() {
    const agencyId = await getActiveAgencyIdOrThrow();
    return await db.query.automationWorkflows.findMany({
        where: eq(automationWorkflows.agencyId, agencyId),
        orderBy: [desc(automationWorkflows.createdAt)],
    });
}

export async function createWorkflow(data: Omit<NewAutomationWorkflow, "id" | "agencyId">) {
    const session = await auth();
    if (!session) throw new Error("Unauthorized");
    const agencyId = await getActiveAgencyIdOrThrow();

    const [workflow] = await db
        .insert(automationWorkflows)
        .values({
            ...data,
            agencyId,
        })
        .returning();

    revalidatePath("/agency/settings/automations");
    return workflow;
}

export async function toggleWorkflow(id: string, isActive: boolean) {
    const agencyId = await getActiveAgencyIdOrThrow();
    const [workflow] = await db
        .update(automationWorkflows)
        .set({ isActive, updatedAt: new Date() })
        .where(and(eq(automationWorkflows.id, id), eq(automationWorkflows.agencyId, agencyId)))
        .returning();

    revalidatePath("/agency/settings/automations");
    return workflow;
}

export async function deleteWorkflow(id: string) {
    const agencyId = await getActiveAgencyIdOrThrow();
    await db
        .delete(automationWorkflows)
        .where(and(eq(automationWorkflows.id, id), eq(automationWorkflows.agencyId, agencyId)));

    revalidatePath("/agency/settings/automations");
}

/**
 * TASKS
 */

export async function getTasks(filters?: { status?: TaskStatus; entityId?: string }) {
    const agencyId = await getActiveAgencyIdOrThrow();
    const whereClauses = [eq(tasks.agencyId, agencyId)];

    if (filters?.status) whereClauses.push(eq(tasks.status, filters.status));
    if (filters?.entityId) whereClauses.push(eq(tasks.entityId, filters.entityId));

    return await db.query.tasks.findMany({
        where: and(...whereClauses),
        orderBy: [desc(tasks.createdAt)],
        with: {
            // Assuming relations are defined, otherwise just fetch
        }
    });
}

export async function updateTaskStatus(id: string, status: TaskStatus) {
    const agencyId = await getActiveAgencyIdOrThrow();
    const [task] = await db
        .update(tasks)
        .set({ status, updatedAt: new Date() })
        .where(and(eq(tasks.id, id), eq(tasks.agencyId, agencyId)))
        .returning();

    revalidatePath("/agency/tasks");
    return task;
}
