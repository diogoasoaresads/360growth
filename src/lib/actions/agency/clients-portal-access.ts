"use server";

import bcrypt from "bcryptjs";
import { randomBytes } from "crypto";
import { db } from "@/lib/db";
import { users, clients, userContexts } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { createAuditLog, getRequestMeta } from "@/lib/audit-log";
import { getActiveAgencyIdOrThrow } from "@/lib/active-context";
import { revalidatePath } from "next/cache";

function generateTempPassword(): string {
  return randomBytes(10).toString("base64url").slice(0, 14);
}

export async function createClientPortalAccess(params: {
  clientId: string;
  email: string;
  name?: string;
}): Promise<{ tempPassword?: string }> {
  const session = await auth();
  if (!session) throw new Error("Não autenticado");

  const { role } = session.user;
  if (role !== "AGENCY_ADMIN" && role !== "SUPER_ADMIN") {
    throw new Error("Apenas AGENCY_ADMIN pode criar acesso ao portal");
  }

  const agencyId = await getActiveAgencyIdOrThrow();

  // Verify client belongs to this agency (tenant isolation)
  const [client] = await db
    .select({ id: clients.id, userId: clients.userId })
    .from(clients)
    .where(and(eq(clients.id, params.clientId), eq(clients.agencyId, agencyId)));

  if (!client) throw new Error("Cliente não encontrado nesta agência");

  const normalizedEmail = params.email.toLowerCase().trim();

  // Check if a user already exists with this email
  const [existingUser] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, normalizedEmail));

  let userId: string;
  let tempPassword: string | undefined;

  if (existingUser) {
    userId = existingUser.id;
  } else {
    tempPassword = generateTempPassword();
    const hash = await bcrypt.hash(tempPassword, 12);
    const [newUser] = await db
      .insert(users)
      .values({
        email: normalizedEmail,
        name: params.name ?? normalizedEmail.split("@")[0],
        passwordHash: hash,
        role: "CLIENT",
        userStatus: "active",
      })
      .returning({ id: users.id });
    userId = newUser.id;
  }

  // Link client record to user
  await db
    .update(clients)
    .set({ userId, updatedAt: new Date() })
    .where(eq(clients.id, params.clientId));

  // Bootstrap user_contexts for the client user
  await db
    .insert(userContexts)
    .values({
      userId,
      activeScope: "client",
      activeClientId: params.clientId,
      updatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: userContexts.userId,
      set: {
        activeScope: "client",
        activeClientId: params.clientId,
        updatedAt: new Date(),
      },
    });

  const meta = await getRequestMeta();
  await createAuditLog({
    userId: session.user.id,
    action: "client_portal_access_created",
    agencyId,
    resourceType: "CLIENT",
    resourceId: params.clientId,
    details: { agencyId, clientId: params.clientId, userId, email: normalizedEmail },
    ...meta,
  });

  revalidatePath(`/agency/crm/clients/${params.clientId}`);

  return { tempPassword };
}

export async function resetClientPortalPassword(params: {
  clientId: string;
}): Promise<{ tempPassword: string }> {
  const session = await auth();
  if (!session) throw new Error("Não autenticado");

  const { role } = session.user;
  if (role !== "AGENCY_ADMIN" && role !== "SUPER_ADMIN") {
    throw new Error("Não autorizado");
  }

  const agencyId = await getActiveAgencyIdOrThrow();

  const [client] = await db
    .select({ id: clients.id, userId: clients.userId })
    .from(clients)
    .where(and(eq(clients.id, params.clientId), eq(clients.agencyId, agencyId)));

  if (!client) throw new Error("Cliente não encontrado nesta agência");
  if (!client.userId) throw new Error("Cliente não possui acesso ao portal");

  const tempPassword = generateTempPassword();
  const hash = await bcrypt.hash(tempPassword, 12);

  await db
    .update(users)
    .set({ passwordHash: hash, updatedAt: new Date() })
    .where(eq(users.id, client.userId));

  const meta = await getRequestMeta();
  await createAuditLog({
    userId: session.user.id,
    action: "client_portal_password_reset",
    agencyId,
    resourceType: "CLIENT",
    resourceId: params.clientId,
    details: { clientId: params.clientId, targetUserId: client.userId },
    ...meta,
  });

  return { tempPassword };
}

export async function revokeClientPortalAccess(params: {
  clientId: string;
}): Promise<void> {
  const session = await auth();
  if (!session) throw new Error("Não autenticado");

  const { role } = session.user;
  if (role !== "AGENCY_ADMIN" && role !== "SUPER_ADMIN") {
    throw new Error("Não autorizado");
  }

  const agencyId = await getActiveAgencyIdOrThrow();

  const [client] = await db
    .select({ id: clients.id, userId: clients.userId })
    .from(clients)
    .where(and(eq(clients.id, params.clientId), eq(clients.agencyId, agencyId)));

  if (!client) throw new Error("Cliente não encontrado nesta agência");

  const prevUserId = client.userId;

  await db
    .update(clients)
    .set({ userId: null, updatedAt: new Date() })
    .where(eq(clients.id, params.clientId));

  const meta = await getRequestMeta();
  await createAuditLog({
    userId: session.user.id,
    action: "client_portal_access_revoked",
    agencyId,
    resourceType: "CLIENT",
    resourceId: params.clientId,
    details: { clientId: params.clientId, revokedUserId: prevUserId },
    ...meta,
  });

  revalidatePath(`/agency/crm/clients/${params.clientId}`);
}
