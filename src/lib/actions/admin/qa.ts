"use server";

import { db } from "@/lib/db";
import {
  users,
  agencies,
  agencyUsers,
  clients,
  deals,
  tickets,
} from "@/lib/db/schema";
import { auth } from "@/lib/auth";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";

export type QaDemoResult = {
  agency: { id: string; name: string; slug: string };
  agencyAdmin: { email: string; password: string };
  client: { id: string; name: string; company: string };
  portalUser: { email: string; password: string };
  deal: { id: string; title: string };
  ticket: { id: string; subject: string };
};

export async function createOrResetDemoData(): Promise<
  { success: true; data: QaDemoResult } | { success: false; error: string }
> {
  try {
    const session = await auth();
    if (!session || session.user.role !== "SUPER_ADMIN") {
      return { success: false, error: "Não autorizado" };
    }

    const AGENCY_SLUG = "agencia-demo";
    const AGENCY_ADMIN_EMAIL = "agency@demo.com";
    const AGENCY_ADMIN_PASSWORD = "Agency@123456";
    const PORTAL_EMAIL = "portal@demo.com";
    const PORTAL_PASSWORD = "Client@123456";

    // ── 1. Upsert agency ────────────────────────────────────────────────────
    const [existingAgency] = await db
      .select()
      .from(agencies)
      .where(eq(agencies.slug, AGENCY_SLUG))
      .limit(1);

    let agencyId: string;

    if (existingAgency) {
      agencyId = existingAgency.id;
      await db
        .update(agencies)
        .set({
          name: "Agência Demo",
          agencyStatus: "active",
          active: true,
          updatedAt: new Date(),
        })
        .where(eq(agencies.id, agencyId));
    } else {
      const [newAgency] = await db
        .insert(agencies)
        .values({
          name: "Agência Demo",
          slug: AGENCY_SLUG,
          email: "contato@agenciademo.com",
          agencyStatus: "active",
          active: true,
          maxMembers: 10,
          maxClients: 100,
        })
        .returning();
      agencyId = newAgency.id;
    }

    // ── 2. Upsert agency admin user ──────────────────────────────────────────
    const adminPasswordHash = await bcrypt.hash(AGENCY_ADMIN_PASSWORD, 12);

    const [existingAdmin] = await db
      .select()
      .from(users)
      .where(eq(users.email, AGENCY_ADMIN_EMAIL))
      .limit(1);

    let adminUserId: string;

    if (existingAdmin) {
      adminUserId = existingAdmin.id;
      await db
        .update(users)
        .set({
          name: "Admin Demo",
          passwordHash: adminPasswordHash,
          role: "AGENCY_ADMIN",
          userStatus: "active",
          updatedAt: new Date(),
        })
        .where(eq(users.id, adminUserId));
    } else {
      const [newAdmin] = await db
        .insert(users)
        .values({
          name: "Admin Demo",
          email: AGENCY_ADMIN_EMAIL,
          passwordHash: adminPasswordHash,
          role: "AGENCY_ADMIN",
          userStatus: "active",
        })
        .returning();
      adminUserId = newAdmin.id;
    }

    // Ensure agency_user link
    const [existingLink] = await db
      .select()
      .from(agencyUsers)
      .where(
        eq(agencyUsers.userId, adminUserId)
      )
      .limit(1);

    if (!existingLink) {
      await db.insert(agencyUsers).values({
        agencyId,
        userId: adminUserId,
        role: "AGENCY_ADMIN",
      });
    } else {
      await db
        .update(agencyUsers)
        .set({ role: "AGENCY_ADMIN", agencyId })
        .where(eq(agencyUsers.userId, adminUserId));
    }

    // ── 3. Upsert portal user ────────────────────────────────────────────────
    const portalPasswordHash = await bcrypt.hash(PORTAL_PASSWORD, 12);

    const [existingPortal] = await db
      .select()
      .from(users)
      .where(eq(users.email, PORTAL_EMAIL))
      .limit(1);

    let portalUserId: string;

    if (existingPortal) {
      portalUserId = existingPortal.id;
      await db
        .update(users)
        .set({
          name: "Cliente Demo",
          passwordHash: portalPasswordHash,
          role: "CLIENT",
          userStatus: "active",
          updatedAt: new Date(),
        })
        .where(eq(users.id, portalUserId));
    } else {
      const [newPortal] = await db
        .insert(users)
        .values({
          name: "Cliente Demo",
          email: PORTAL_EMAIL,
          passwordHash: portalPasswordHash,
          role: "CLIENT",
          userStatus: "active",
        })
        .returning();
      portalUserId = newPortal.id;
    }

    // ── 4. Upsert client record ──────────────────────────────────────────────
    const [existingClient] = await db
      .select()
      .from(clients)
      .where(eq(clients.agencyId, agencyId))
      .limit(1);

    let clientId: string;

    if (existingClient) {
      clientId = existingClient.id;
      await db
        .update(clients)
        .set({
          name: "Cliente Demo LTDA",
          email: PORTAL_EMAIL,
          company: "Cliente Demo LTDA",
          userId: portalUserId,
          status: "active",
          updatedAt: new Date(),
        })
        .where(eq(clients.id, clientId));
    } else {
      const [newClient] = await db
        .insert(clients)
        .values({
          agencyId,
          userId: portalUserId,
          name: "Cliente Demo LTDA",
          email: PORTAL_EMAIL,
          company: "Cliente Demo LTDA",
          status: "active",
        })
        .returning();
      clientId = newClient.id;
    }

    // ── 5. Upsert deal ───────────────────────────────────────────────────────
    const [existingDeal] = await db
      .select()
      .from(deals)
      .where(eq(deals.agencyId, agencyId))
      .limit(1);

    let dealId: string;

    if (existingDeal) {
      dealId = existingDeal.id;
      await db
        .update(deals)
        .set({
          title: "Projeto de Marketing Digital",
          value: "5000.00",
          stage: "PROPOSAL",
          updatedAt: new Date(),
        })
        .where(eq(deals.id, dealId));
    } else {
      const [newDeal] = await db
        .insert(deals)
        .values({
          agencyId,
          clientId,
          title: "Projeto de Marketing Digital",
          value: "5000.00",
          stage: "PROPOSAL",
          description: "Gestão de campanhas de performance + SEO",
        })
        .returning();
      dealId = newDeal.id;
    }

    // ── 6. Upsert ticket ─────────────────────────────────────────────────────
    const [existingTicket] = await db
      .select()
      .from(tickets)
      .where(eq(tickets.agencyId, agencyId))
      .limit(1);

    let ticketId: string;

    if (existingTicket) {
      ticketId = existingTicket.id;
      await db
        .update(tickets)
        .set({
          subject: "Relatório mensal de performance",
          status: "OPEN",
          priority: "MEDIUM",
          updatedAt: new Date(),
        })
        .where(eq(tickets.id, ticketId));
    } else {
      const [newTicket] = await db
        .insert(tickets)
        .values({
          agencyId,
          clientId,
          subject: "Relatório mensal de performance",
          status: "OPEN",
          priority: "MEDIUM",
          type: "SUPPORT",
          createdBy: adminUserId,
        })
        .returning();
      ticketId = newTicket.id;
    }

    return {
      success: true,
      data: {
        agency: { id: agencyId, name: "Agência Demo", slug: AGENCY_SLUG },
        agencyAdmin: {
          email: AGENCY_ADMIN_EMAIL,
          password: AGENCY_ADMIN_PASSWORD,
        },
        client: {
          id: clientId,
          name: "Cliente Demo LTDA",
          company: "Cliente Demo LTDA",
        },
        portalUser: { email: PORTAL_EMAIL, password: PORTAL_PASSWORD },
        deal: { id: dealId, title: "Projeto de Marketing Digital" },
        ticket: { id: ticketId, subject: "Relatório mensal de performance" },
      },
    };
  } catch (err) {
    console.error("[qa] createOrResetDemoData error", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "Erro inesperado",
    };
  }
}
