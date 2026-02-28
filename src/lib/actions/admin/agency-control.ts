"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { agencies } from "@/lib/db/schema";
import { eq, isNull, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { createAuditLog } from "@/lib/audit-log";
import { setActiveContext } from "@/lib/actions/admin/context";
import type { ActionResult } from "@/lib/types";
import type { AgencyStatus } from "@/lib/db/schema";

async function requireSuperAdmin() {
  const session = await auth();
  if (!session || session.user.role !== "SUPER_ADMIN") {
    throw new Error("Não autorizado");
  }
  return session;
}

/** Enter agency context as SUPER_ADMIN. Returns the redirect URL. */
export async function enterAgencyMode(
  agencyId: string
): Promise<ActionResult<{ redirectTo: string }>> {
  try {
    const session = await requireSuperAdmin();

    await setActiveContext("agency", agencyId);

    await createAuditLog({
      userId: session.user.id,
      action: "agency_entered",
      resourceType: "AGENCY",
      resourceId: agencyId,
      agencyId,
      details: { agencyId },
    });

    return { success: true, data: { redirectTo: "/agency/dashboard" } };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Erro ao entrar no modo agência",
    };
  }
}

/** Block or unblock (or any other status transition) for an agency. */
export async function setAgencyStatus(
  agencyId: string,
  newStatus: AgencyStatus
): Promise<ActionResult<void>> {
  try {
    const session = await requireSuperAdmin();

    const [current] = await db
      .select({ agencyStatus: agencies.agencyStatus })
      .from(agencies)
      .where(and(eq(agencies.id, agencyId), isNull(agencies.deletedAt)));

    if (!current) return { success: false, error: "Agência não encontrada" };

    const before = current.agencyStatus;

    await db
      .update(agencies)
      .set({
        agencyStatus: newStatus,
        active: newStatus === "active" || newStatus === "trial",
        updatedAt: new Date(),
      })
      .where(and(eq(agencies.id, agencyId), isNull(agencies.deletedAt)));

    await createAuditLog({
      userId: session.user.id,
      action: "agency_status_changed",
      resourceType: "AGENCY",
      resourceId: agencyId,
      agencyId,
      details: { agencyId, before, after: newStatus },
    });

    revalidatePath(`/admin/agencies/${agencyId}`);
    revalidatePath("/admin/agencies");
    return { success: true, data: undefined };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Erro ao atualizar status",
    };
  }
}
