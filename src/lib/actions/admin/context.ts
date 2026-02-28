"use server";

import { auth } from "@/lib/auth";
import { cookies } from "next/headers";
import { db } from "@/lib/db";
import { userContexts, agencies } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import type { ActiveScope } from "@/lib/db/schema";

export type { ActiveScope };

export const SCOPE_COOKIE = "admin_scope";
export const AGENCY_ID_COOKIE = "admin_agency_id";

export const COOKIE_OPTS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
  maxAge: 60 * 60 * 24 * 7, // 7 days
};

export async function setActiveContext(
  scope: ActiveScope,
  agencyId?: string
): Promise<void> {
  const session = await auth();
  if (!session || session.user.role !== "SUPER_ADMIN") {
    throw new Error("Não autorizado");
  }

  // Validate that the target agency actually exists before accepting the switch
  if (scope === "agency") {
    if (!agencyId) throw new Error("agencyId é obrigatório para contexto de agência");
    const [agency] = await db
      .select({ id: agencies.id })
      .from(agencies)
      .where(eq(agencies.id, agencyId));
    if (!agency) throw new Error("Agência não encontrada ou foi removida");
  }

  const resolvedAgencyId = scope === "agency" ? agencyId! : null;

  // Persist to user_contexts (upsert)
  await db
    .insert(userContexts)
    .values({
      userId: session.user.id,
      activeScope: scope,
      activeAgencyId: resolvedAgencyId,
      updatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: userContexts.userId,
      set: {
        activeScope: scope,
        activeAgencyId: resolvedAgencyId,
        updatedAt: new Date(),
      },
    });

  // Mirror to cookie (fast-path cache for middleware)
  const store = await cookies();
  store.set(SCOPE_COOKIE, scope, COOKIE_OPTS);
  if (resolvedAgencyId) {
    store.set(AGENCY_ID_COOKIE, resolvedAgencyId, COOKIE_OPTS);
  } else {
    store.delete(AGENCY_ID_COOKIE);
  }
}
