"use server";

import { auth } from "@/lib/auth";
import { cookies } from "next/headers";
import { encode } from "@auth/core/jwt";
import { db } from "@/lib/db";
import { users, agencyUsers, agencies, auditLogs } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import type { ActionResult } from "@/lib/types";
import { redirect } from "next/navigation";

const SECRET =
  process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET ?? "";

const isSecure = process.env.NODE_ENV === "production";
const COOKIE_PREFIX = isSecure ? "__Secure-" : "";
const SESSION_COOKIE = `${COOKIE_PREFIX}authjs.session-token`;
const IMPERSONATION_COOKIE = `${COOKIE_PREFIX}authjs.impersonation-backup`;

export async function impersonateUser(
  targetUserId: string
): Promise<ActionResult<{ redirectTo: string }>> {
  const session = await auth();

  if (!session?.user || session.user.role !== "SUPER_ADMIN") {
    return { success: false, error: "Não autorizado" };
  }

  if (session.user.isImpersonating) {
    return { success: false, error: "Já está em modo de impersonation" };
  }

  const [targetUser] = await db
    .select()
    .from(users)
    .where(eq(users.id, targetUserId));

  if (!targetUser) return { success: false, error: "Usuário não encontrado" };

  if (targetUser.role === "SUPER_ADMIN") {
    return { success: false, error: "Não é possível impersonar um Super Admin" };
  }

  // Get target user's agency + name
  const [agencyRow] = await db
    .select({
      agencyId: agencyUsers.agencyId,
      role: agencyUsers.role,
      agencyName: agencies.name,
    })
    .from(agencyUsers)
    .leftJoin(agencies, eq(agencies.id, agencyUsers.agencyId))
    .where(eq(agencyUsers.userId, targetUserId))
    .limit(1);

  const cookieStore = await cookies();
  const originalToken = cookieStore.get(SESSION_COOKIE)?.value;

  if (!originalToken) {
    return { success: false, error: "Sessão original não encontrada" };
  }

  // Build impersonation JWT payload
  const now = Math.floor(Date.now() / 1000);
  const impersonationToken = await encode({
    token: {
      id: targetUser.id,
      email: targetUser.email ?? "",
      name: targetUser.name,
      image: targetUser.image,
      role: targetUser.role,
      agencyId: agencyRow?.agencyId ?? null,
      agencyRole: agencyRow?.role ?? null,
      agencyName: agencyRow?.agencyName ?? null,
      isImpersonating: true,
      originalAdminId: session.user.id,
      iat: now,
      exp: now + 60 * 60, // 1 hour
    },
    secret: SECRET,
    salt: SESSION_COOKIE,
    maxAge: 60 * 60,
  });

  // Persist original token in backup cookie
  cookieStore.set(IMPERSONATION_COOKIE, originalToken, {
    httpOnly: true,
    secure: isSecure,
    sameSite: "strict",
    maxAge: 60 * 60,
    path: "/",
  });

  // Replace session cookie
  cookieStore.set(SESSION_COOKIE, impersonationToken, {
    httpOnly: true,
    secure: isSecure,
    sameSite: "lax",
    maxAge: 60 * 60,
    path: "/",
  });

  // Audit log
  await db.insert(auditLogs).values({
    userId: session.user.id,
    agencyId: agencyRow?.agencyId ?? null,
    action: "user.impersonated",
    entityType: "USER",
    entityId: targetUserId,
    metadata: {
      targetEmail: targetUser.email,
      targetRole: targetUser.role,
      adminId: session.user.id,
    },
  });

  const redirectTo =
    targetUser.role === "CLIENT" ? "/portal/dashboard" : "/agency/dashboard";

  return { success: true, data: { redirectTo } };
}

export async function stopImpersonation(): Promise<void> {
  const cookieStore = await cookies();
  const originalToken = cookieStore.get(IMPERSONATION_COOKIE)?.value;

  if (originalToken) {
    // Restore original admin session
    cookieStore.set(SESSION_COOKIE, originalToken, {
      httpOnly: true,
      secure: isSecure,
      sameSite: "lax",
      maxAge: 30 * 24 * 60 * 60,
      path: "/",
    });

    // Remove backup cookie
    cookieStore.delete(IMPERSONATION_COOKIE);
  }

  redirect("/admin/users");
}
