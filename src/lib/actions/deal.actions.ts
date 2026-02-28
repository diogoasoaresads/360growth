"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { deals } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { createDealSchema, updateDealSchema } from "@/lib/validations/deal";
import type { CreateDealInput, UpdateDealInput } from "@/lib/validations/deal";
import { validatePlanLimit } from "@/lib/usage/agency-usage";
import { getActiveAgencyIdOrThrow } from "@/lib/active-context";
import { isFeatureEnabled } from "@/lib/feature-flags/agency-flags";

export async function createDeal(input: CreateDealInput) {
  const session = await auth();
  if (!session) throw new Error("Unauthorized");

  const agencyId = await getActiveAgencyIdOrThrow();

  if (!await isFeatureEnabled(agencyId, "deals_enabled")) {
    throw new Error("Módulo de deals está desabilitado para esta agência.");
  }

  const parsed = createDealSchema.safeParse(input);
  if (!parsed.success) throw new Error("Dados inválidos");

  await validatePlanLimit({ agencyId, actorUserId: session.user.id, resourceType: "deals", context: { action: "createDeal" } });

  const [deal] = await db
    .insert(deals)
    .values({
      ...parsed.data,
      agencyId,
      value: parsed.data.value !== undefined ? String(parsed.data.value) : null,
    })
    .returning();

  revalidatePath("/agency/crm");
  return deal;
}

export async function updateDeal(id: string, input: UpdateDealInput) {
  const agencyId = await getActiveAgencyIdOrThrow();
  const parsed = updateDealSchema.safeParse(input);
  if (!parsed.success) throw new Error("Dados inválidos");

  const { value, ...rest } = parsed.data;

  const [deal] = await db
    .update(deals)
    .set({
      ...rest,
      ...(value !== undefined ? { value: String(value) } : {}),
      updatedAt: new Date(),
    })
    .where(and(eq(deals.id, id), eq(deals.agencyId, agencyId)))
    .returning();

  revalidatePath("/agency/crm");
  return deal;
}

export async function deleteDeal(id: string) {
  const agencyId = await getActiveAgencyIdOrThrow();

  await db
    .delete(deals)
    .where(and(eq(deals.id, id), eq(deals.agencyId, agencyId)));

  revalidatePath("/agency/crm");
}
