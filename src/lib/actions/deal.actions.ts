"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { deals } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { createDealSchema, updateDealSchema } from "@/lib/validations/deal";
import type { CreateDealInput, UpdateDealInput } from "@/lib/validations/deal";
import { validatePlanLimit } from "@/lib/plan-limits";

async function getSession() {
  const session = await auth();
  if (!session) throw new Error("Unauthorized");
  return session;
}

export async function createDeal(input: CreateDealInput) {
  const session = await getSession();
  const agencyId = session.user.agencyId;
  if (!agencyId) throw new Error("Agency not found");

  const parsed = createDealSchema.safeParse(input);
  if (!parsed.success) throw new Error("Dados inválidos");

  const check = await validatePlanLimit(agencyId, "deals", session.user.id);
  if (!check.allowed) throw new Error(check.error);

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
  const session = await getSession();
  const agencyId = session.user.agencyId;
  if (!agencyId) throw new Error("Agency not found");

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
  const session = await getSession();
  const agencyId = session.user.agencyId;
  if (!agencyId) throw new Error("Agency not found");

  await db
    .delete(deals)
    .where(and(eq(deals.id, id), eq(deals.agencyId, agencyId)));

  revalidatePath("/agency/crm");
}
