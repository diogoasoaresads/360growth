"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { clients } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { createClientSchema, updateClientSchema } from "@/lib/validations/client";
import type { CreateClientInput, UpdateClientInput } from "@/lib/validations/client";

async function getAgencyId(): Promise<string> {
  const session = await auth();
  if (!session?.user.agencyId) throw new Error("Unauthorized");
  return session.user.agencyId;
}

export async function createClient(input: CreateClientInput) {
  const agencyId = await getAgencyId();
  const parsed = createClientSchema.safeParse(input);
  if (!parsed.success) throw new Error("Dados inválidos");

  const [client] = await db
    .insert(clients)
    .values({ ...parsed.data, agencyId })
    .returning();

  revalidatePath("/agency/crm/clients");
  return client;
}

export async function updateClient(id: string, input: UpdateClientInput) {
  const agencyId = await getAgencyId();
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
  const agencyId = await getAgencyId();

  await db
    .delete(clients)
    .where(and(eq(clients.id, id), eq(clients.agencyId, agencyId)));

  revalidatePath("/agency/crm/clients");
}
