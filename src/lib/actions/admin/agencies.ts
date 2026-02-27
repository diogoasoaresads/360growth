"use server";

import { db } from "@/lib/db";
import { agencies, plans } from "@/lib/db/schema";
import { auth } from "@/lib/auth";
import { eq, and, ilike, count, desc, isNull, sql } from "drizzle-orm";
import type { ActionResult } from "@/lib/types";
import type { Agency, Plan, AgencyStatus } from "@/lib/db/schema";
import {
  createAgencySchema,
  updateAgencySchema,
  type CreateAgencyInput,
  type UpdateAgencyInput,
} from "@/lib/validations/agency";
import { revalidatePath } from "next/cache";
import { createAuditLog } from "@/lib/audit-log";

async function requireSuperAdmin() {
  const session = await auth();
  if (!session || session.user.role !== "SUPER_ADMIN") {
    throw new Error("Não autorizado");
  }
  return session;
}

export type AgencyListItem = Agency & {
  plan: Pick<Plan, "id" | "name"> | null;
  membersCount: number;
  clientsCount: number;
};

export type AgenciesListParams = {
  page?: number;
  perPage?: number;
  search?: string;
  status?: AgencyStatus | "";
  planId?: string;
};

export type AgenciesListResult = {
  agencies: AgencyListItem[];
  total: number;
  page: number;
  perPage: number;
};

export async function getAgencies(
  params: AgenciesListParams = {}
): Promise<ActionResult<AgenciesListResult>> {
  try {
    await requireSuperAdmin();

    const { page = 1, perPage = 25, search, status, planId } = params;
    const offset = (page - 1) * perPage;

    // Build conditions
    const conditions: ReturnType<typeof eq>[] = [isNull(agencies.deletedAt)];
    if (search) conditions.push(ilike(agencies.name, `%${search}%`));
    if (status) conditions.push(eq(agencies.agencyStatus, status as AgencyStatus));
    if (planId) conditions.push(eq(agencies.planId, planId));

    const where = and(...conditions);

    const [{ total }] = await db
      .select({ total: count() })
      .from(agencies)
      .where(where);

    const rows = await db
      .select({
        agency: agencies,
        plan: { id: plans.id, name: plans.name },
        membersCount: sql<number>`(SELECT COUNT(*) FROM agency_users WHERE agency_id = ${agencies.id})`,
        clientsCount: sql<number>`(SELECT COUNT(*) FROM clients WHERE agency_id = ${agencies.id})`,
      })
      .from(agencies)
      .leftJoin(plans, eq(agencies.planId, plans.id))
      .where(where)
      .orderBy(desc(agencies.createdAt))
      .limit(perPage)
      .offset(offset);

    const data: AgencyListItem[] = rows.map((r) => ({
      ...r.agency,
      plan: r.plan?.id ? (r.plan as Pick<Plan, "id" | "name">) : null,
      membersCount: Number(r.membersCount),
      clientsCount: Number(r.clientsCount),
    }));

    return {
      success: true,
      data: { agencies: data, total, page, perPage },
    };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Erro ao buscar agências",
    };
  }
}

export type AgencyDetail = Agency & {
  plan: Plan | null;
};

export async function getAgencyById(
  agencyId: string
): Promise<ActionResult<AgencyDetail>> {
  try {
    await requireSuperAdmin();
    const [row] = await db
      .select({ agency: agencies, plan: plans })
      .from(agencies)
      .leftJoin(plans, eq(agencies.planId, plans.id))
      .where(and(eq(agencies.id, agencyId), isNull(agencies.deletedAt)));

    if (!row) return { success: false, error: "Agência não encontrada" };
    return { success: true, data: { ...row.agency, plan: row.plan ?? null } };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Erro ao buscar agência",
    };
  }
}

export async function createAgency(
  input: CreateAgencyInput
): Promise<ActionResult<Agency>> {
  try {
    const session = await requireSuperAdmin();
    const parsed = createAgencySchema.safeParse(input);
    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.issues[0]?.message ?? "Dados inválidos",
      };
    }

    const { email, website, phone, planId, ...rest } = parsed.data;

    const [existing] = await db
      .select({ id: agencies.id })
      .from(agencies)
      .where(eq(agencies.slug, rest.slug));
    if (existing) {
      return {
        success: false,
        error: "Já existe uma agência com este slug",
      };
    }

    const [agency] = await db
      .insert(agencies)
      .values({
        ...rest,
        email: email || null,
        website: website || null,
        phone: phone || null,
        planId: planId || null,
        agencyStatus: "trial",
      })
      .returning();

    await createAuditLog({
      userId: session.user.id,
      action: "agency.created",
      resourceType: "AGENCY",
      resourceId: agency.id,
      details: { name: agency.name, slug: agency.slug },
    });

    revalidatePath("/admin/agencies");
    return { success: true, data: agency };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Erro ao criar agência",
    };
  }
}

export async function updateAgency(
  agencyId: string,
  input: UpdateAgencyInput
): Promise<ActionResult<Agency>> {
  try {
    const session = await requireSuperAdmin();
    const parsed = updateAgencySchema.safeParse(input);
    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.issues[0]?.message ?? "Dados inválidos",
      };
    }

    const [updated] = await db
      .update(agencies)
      .set({ ...parsed.data, updatedAt: new Date() })
      .where(and(eq(agencies.id, agencyId), isNull(agencies.deletedAt)))
      .returning();

    if (!updated) return { success: false, error: "Agência não encontrada" };

    await createAuditLog({
      userId: session.user.id,
      action: "agency.updated",
      resourceType: "AGENCY",
      resourceId: agencyId,
      details: { changes: parsed.data },
    });

    revalidatePath("/admin/agencies");
    revalidatePath(`/admin/agencies/${agencyId}`);
    return { success: true, data: updated };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Erro ao atualizar agência",
    };
  }
}

export async function toggleAgencyStatus(
  agencyId: string,
  newStatus: "active" | "suspended"
): Promise<ActionResult<Agency>> {
  try {
    const session = await requireSuperAdmin();
    const [updated] = await db
      .update(agencies)
      .set({
        agencyStatus: newStatus,
        active: newStatus === "active",
        updatedAt: new Date(),
      })
      .where(and(eq(agencies.id, agencyId), isNull(agencies.deletedAt)))
      .returning();

    if (!updated) return { success: false, error: "Agência não encontrada" };

    await createAuditLog({
      userId: session.user.id,
      action: newStatus === "suspended" ? "agency.suspended" : "agency.reactivated",
      resourceType: "AGENCY",
      resourceId: agencyId,
      details: { newStatus },
    });

    revalidatePath("/admin/agencies");
    revalidatePath(`/admin/agencies/${agencyId}`);
    return { success: true, data: updated };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Erro ao atualizar status",
    };
  }
}

export async function deleteAgency(
  agencyId: string
): Promise<ActionResult<void>> {
  try {
    const session = await requireSuperAdmin();
    const [updated] = await db
      .update(agencies)
      .set({
        deletedAt: new Date(),
        agencyStatus: "deleted",
        active: false,
        updatedAt: new Date(),
      })
      .where(and(eq(agencies.id, agencyId), isNull(agencies.deletedAt)))
      .returning();

    if (!updated) return { success: false, error: "Agência não encontrada" };

    await createAuditLog({
      userId: session.user.id,
      action: "agency.deleted",
      resourceType: "AGENCY",
      resourceId: agencyId,
    });

    revalidatePath("/admin/agencies");
    return { success: true, data: undefined };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Erro ao excluir agência",
    };
  }
}
