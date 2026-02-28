"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { clients } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { createClientSchema, updateClientSchema } from "@/lib/validations/client";
import type { CreateClientInput, UpdateClientInput } from "@/lib/validations/client";
import { validatePlanLimit } from "@/lib/usage/agency-usage";
import { getActiveAgencyIdOrThrow } from "@/lib/active-context";

export async function createClient(input: CreateClientInput) {
  const session = await auth();
  if (!session) throw new Error("Unauthorized");

  const agencyId = await getActiveAgencyIdOrThrow();
  const parsed = createClientSchema.safeParse(input);
  if (!parsed.success) throw new Error("Dados inválidos");

  await validatePlanLimit({ agencyId, actorUserId: session.user.id, resourceType: "clients" });

  const [client] = await db
    .insert(clients)
    .values({ ...parsed.data, agencyId })
    .returning();

  revalidatePath("/agency/crm/clients");
  return client;
}

export async function updateClient(id: string, input: UpdateClientInput) {
  const agencyId = await getActiveAgencyIdOrThrow();
  const parsed = updateClientSchema.safeParse(input);
  if (!parsed.success) throw new Error("Dados inválidos");

  const [client] = await db
    .update(clients)
    .set({ ...parsed.data, updatedAt: new Date() })
    .where(and(eq(clients.id, id), eq(clients.agencyId, agencyId)))
    .returning();

  revalidatePath("/agency/crm/clients");
  return client;
}

export async function deleteClient(id: string) {
  const agencyId = await getActiveAgencyIdOrThrow();

  await db
    .delete(clients)
    .where(and(eq(clients.id, id), eq(clients.agencyId, agencyId)));

  revalidatePath("/agency/crm/clients");
}
