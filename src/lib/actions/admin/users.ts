"use server";

import { db } from "@/lib/db";
import {
  users,
  agencyUsers,
  agencies,
  plans,
  auditLogs,
} from "@/lib/db/schema";
import { auth } from "@/lib/auth";
import {
  eq,
  and,
  ilike,
  count,
  desc,
  or,
} from "drizzle-orm";
import type { ActionResult } from "@/lib/types";
import type {
  User,
  AuditLog,
  UserRole,
  UserStatus,
  AgencyUserRole,
} from "@/lib/db/schema";
import { revalidatePath } from "next/cache";

async function requireSuperAdmin() {
  const session = await auth();
  if (!session || session.user.role !== "SUPER_ADMIN") {
    throw new Error("Não autorizado");
  }
  return session;
}

export type UserWithAgency = User & {
  agency: {
    id: string;
    name: string;
    slug: string;
    plan: { name: string } | null;
  } | null;
  agencyRole: AgencyUserRole | null;
  memberSince: Date | null;
};

export type UsersListParams = {
  page?: number;
  perPage?: number;
  search?: string;
  role?: string;
  agencyId?: string;
};

export type UsersListResult = {
  users: UserWithAgency[];
  total: number;
  page: number;
  perPage: number;
};

export async function getUsers(
  params: UsersListParams = {}
): Promise<ActionResult<UsersListResult>> {
  try {
    await requireSuperAdmin();

    const { page = 1, perPage = 25, search, role, agencyId } = params;
    const offset = (page - 1) * perPage;

    const conditions = [];
    if (search) {
      conditions.push(
        or(ilike(users.name, `%${search}%`), ilike(users.email, `%${search}%`))
      );
    }
    if (role) conditions.push(eq(users.role, role as UserRole));

    const where = conditions.length > 0 ? and(...conditions) : undefined;

    const [{ total }] = await db
      .select({ total: count() })
      .from(users)
      .where(where);

    const rows = await db
      .select({
        user: users,
        agencyUser: {
          agencyId: agencyUsers.agencyId,
          role: agencyUsers.role,
          createdAt: agencyUsers.createdAt,
        },
        agency: {
          id: agencies.id,
          name: agencies.name,
          slug: agencies.slug,
        },
        plan: { name: plans.name },
      })
      .from(users)
      .leftJoin(agencyUsers, eq(agencyUsers.userId, users.id))
      .leftJoin(agencies, eq(agencies.id, agencyUsers.agencyId))
      .leftJoin(plans, eq(plans.id, agencies.planId))
      .where(
        agencyId
          ? and(where, eq(agencyUsers.agencyId, agencyId))
          : where
      )
      .orderBy(desc(users.createdAt))
      .limit(perPage)
      .offset(offset);

    // Deduplicate (user may have multiple agency memberships)
    const seen = new Set<string>();
    const data: UserWithAgency[] = [];
    for (const row of rows) {
      if (!seen.has(row.user.id)) {
        seen.add(row.user.id);
        data.push({
          ...row.user,
          agency: row.agency?.id
            ? {
                id: row.agency.id,
                name: row.agency.name,
                slug: row.agency.slug,
                plan: row.plan?.name ? { name: row.plan.name } : null,
              }
            : null,
          agencyRole: row.agencyUser?.role ?? null,
          memberSince: row.agencyUser?.createdAt ?? null,
        });
      }
    }

    return { success: true, data: { users: data, total, page, perPage } };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Erro ao buscar usuários",
    };
  }
}

export type UserDetail = UserWithAgency & {
  recentLogs: AuditLog[];
};

export async function getUserById(
  userId: string
): Promise<ActionResult<UserDetail>> {
  try {
    await requireSuperAdmin();

    const [row] = await db
      .select({
        user: users,
        agencyUser: {
          agencyId: agencyUsers.agencyId,
          role: agencyUsers.role,
          createdAt: agencyUsers.createdAt,
        },
        agency: {
          id: agencies.id,
          name: agencies.name,
          slug: agencies.slug,
        },
        plan: { name: plans.name },
      })
      .from(users)
      .leftJoin(agencyUsers, eq(agencyUsers.userId, users.id))
      .leftJoin(agencies, eq(agencies.id, agencyUsers.agencyId))
      .leftJoin(plans, eq(plans.id, agencies.planId))
      .where(eq(users.id, userId));

    if (!row) return { success: false, error: "Usuário não encontrado" };

    const recentLogs = await db
      .select()
      .from(auditLogs)
      .where(eq(auditLogs.userId, userId))
      .orderBy(desc(auditLogs.createdAt))
      .limit(10);

    return {
      success: true,
      data: {
        ...row.user,
        agency: row.agency?.id
          ? {
              id: row.agency.id,
              name: row.agency.name,
              slug: row.agency.slug,
              plan: row.plan?.name ? { name: row.plan.name } : null,
            }
          : null,
        agencyRole: row.agencyUser?.role ?? null,
        memberSince: row.agencyUser?.createdAt ?? null,
        recentLogs,
      },
    };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Erro ao buscar usuário",
    };
  }
}

export async function updateUser(
  userId: string,
  data: { name?: string; email?: string; role?: string }
): Promise<ActionResult<User>> {
  try {
    const callerSession = await requireSuperAdmin();

    // Block destructive actions during impersonation
    if (callerSession.user.isImpersonating) {
      return { success: false, error: "Ação não permitida durante impersonation" };
    }

    const updateData: Partial<User> = { updatedAt: new Date() };
    if (data.name !== undefined) updateData.name = data.name;
    if (data.email !== undefined) updateData.email = data.email;
    if (data.role !== undefined) updateData.role = data.role as UserRole;

    const [updated] = await db
      .update(users)
      .set(updateData)
      .where(eq(users.id, userId))
      .returning();

    if (!updated) return { success: false, error: "Usuário não encontrado" };

    await db.insert(auditLogs).values({
      userId: callerSession.user.id,
      action: "user.updated",
      entityType: "USER",
      entityId: userId,
      metadata: { changes: data },
    });

    revalidatePath("/admin/users");
    revalidatePath(`/admin/users/${userId}`);
    return { success: true, data: updated };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Erro ao atualizar usuário",
    };
  }
}

export async function sendPasswordReset(
  userId: string
): Promise<ActionResult<void>> {
  try {
    const callerSession = await requireSuperAdmin();

    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, userId));
    if (!user) return { success: false, error: "Usuário não encontrado" };

    // TODO: Integrate with Resend to send actual reset email
    await db.insert(auditLogs).values({
      userId: callerSession.user.id,
      action: "user.password_reset",
      entityType: "USER",
      entityId: userId,
      metadata: { targetEmail: user.email },
    });

    return { success: true, data: undefined };
  } catch (err) {
    return {
      success: false,
      error:
        err instanceof Error ? err.message : "Erro ao enviar reset de senha",
    };
  }
}

export async function toggleUserStatus(
  userId: string
): Promise<ActionResult<User>> {
  try {
    const callerSession = await requireSuperAdmin();

    if (callerSession.user.isImpersonating) {
      return { success: false, error: "Ação não permitida durante impersonation" };
    }

    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, userId));
    if (!user) return { success: false, error: "Usuário não encontrado" };

    if (user.role === "SUPER_ADMIN") {
      return { success: false, error: "Não é possível suspender um Super Admin" };
    }

    const newStatus: UserStatus =
      user.userStatus === "active" ? "suspended" : "active";

    const [updated] = await db
      .update(users)
      .set({ userStatus: newStatus, updatedAt: new Date() })
      .where(eq(users.id, userId))
      .returning();

    await db.insert(auditLogs).values({
      userId: callerSession.user.id,
      action: newStatus === "suspended" ? "user.suspended" : "user.activated",
      entityType: "USER",
      entityId: userId,
    });

    revalidatePath("/admin/users");
    revalidatePath(`/admin/users/${userId}`);
    return { success: true, data: updated };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Erro ao atualizar status",
    };
  }
}
