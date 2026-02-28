"use server";

import { auth } from "@/lib/auth";
import { cookies } from "next/headers";
import { db } from "@/lib/db";
import { userContexts, agencies } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import type { ActiveScope } from "@/lib/db/schema";
import {
  SCOPE_COOKIE,
  AGENCY_ID_COOKIE,
  COOKIE_OPTS,
} from "@/lib/actions/admin/context.constants";

export async function setActiveContext(
  scope: ActiveScope,
  agencyId?: string | null,
  clientId?: string | null
): Promise<void> {
  const session = await auth();
  if (!session || session.user.role !== "SUPER_ADMIN") {
    throw new Error("Não autorizado");
  }

  if (scope === "agency") {
    if (!agencyId) throw new Error("agencyId é obrigatório para contexto de agência");
    const [agency] = await db
      .select({ id: agencies.id })
      .from(agencies)
      .where(eq(agencies.id, agencyId));
    if (!agency) throw new Error("Agência não encontrada ou foi removida");
  }

  const resolvedAgencyId = scope === "agency" ? (agencyId ?? null) : null;
  const resolvedClientId = scope === "client" ? (clientId ?? null) : null;

  await db
    .insert(userContexts)
    .values({
      userId: session.user.id,
      activeScope: scope,
      activeAgencyId: resolvedAgencyId,
      activeClientId: resolvedClientId,
      updatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: userContexts.userId,
      set: {
        activeScope: scope,
        activeAgencyId: resolvedAgencyId,
        activeClientId: resolvedClientId,
        updatedAt: new Date(),
      },
    });

  const store = await cookies();
  store.set(SCOPE_COOKIE, scope, COOKIE_OPTS);
  if (resolvedAgencyId) {
    store.set(AGENCY_ID_COOKIE, resolvedAgencyId, COOKIE_OPTS);
  } else {
    store.delete(AGENCY_ID_COOKIE);
  }
}
