import "server-only";

import { cookies } from "next/headers";
import { auth } from "@/lib/auth";
import { SCOPE_COOKIE, AGENCY_ID_COOKIE } from "@/lib/actions/admin/context";

export type ActiveScope = "platform" | "agency";

export async function getActiveScope(): Promise<ActiveScope> {
  const store = await cookies();
  const val = store.get(SCOPE_COOKIE)?.value;
  return val === "agency" ? "agency" : "platform";
}

export async function getActiveAgencyId(): Promise<string | null> {
  const store = await cookies();
  return store.get(AGENCY_ID_COOKIE)?.value ?? null;
}

/**
 * Use this in /agency/* server actions / pages to get the acting agencyId.
 * - SUPER_ADMIN: reads from the admin_agency_id cookie (must be in agency scope)
 * - AGENCY_ADMIN / AGENCY_MEMBER: uses their own session agencyId
 */
export async function getActiveAgencyIdOrThrow(): Promise<string> {
  const session = await auth();
  if (!session) throw new Error("Unauthorized");

  if (session.user.role !== "SUPER_ADMIN") {
    if (!session.user.agencyId) throw new Error("Agency not found");
    return session.user.agencyId;
  }

  const agencyId = await getActiveAgencyId();
  if (!agencyId) {
    throw new Error(
      "Contexto de agência não definido. Selecione uma agência no topo."
    );
  }
  return agencyId;
}
