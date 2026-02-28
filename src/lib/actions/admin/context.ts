"use server";

import { auth } from "@/lib/auth";
import { cookies } from "next/headers";

export type ActiveScope = "platform" | "agency";

export const SCOPE_COOKIE = "admin_scope";
export const AGENCY_ID_COOKIE = "admin_agency_id";

const COOKIE_OPTS = {
  httpOnly: true,
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

  const store = await cookies();
  store.set(SCOPE_COOKIE, scope, COOKIE_OPTS);

  if (scope === "agency" && agencyId) {
    store.set(AGENCY_ID_COOKIE, agencyId, COOKIE_OPTS);
  } else {
    store.delete(AGENCY_ID_COOKIE);
  }
}
