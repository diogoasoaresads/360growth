"use server";

/**
 * setup.ts — one-shot bootstrap action.
 *
 * Only available when QA_TOOLS_ENABLED=true OR NODE_ENV=development.
 * Does NOT require authentication — it is the mechanism to CREATE the first
 * SUPER_ADMIN when the database is empty.
 *
 * Idempotent: safe to run multiple times.
 */

import { db } from "@/lib/db";
import {
  users,
  agencies,
  agencyUsers,
  clients,
  deals,
  tickets,
} from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";

export type SetupResult = {
  superAdmin: { email: string; password: string };
  agencyAdmin: { email: string; password: string };
  portalUser: { email: string; password: string };
  agency: { name: string; slug: string };
};

export async function bootstrapDemoData(): Promise<
  { success: true; data: SetupResult; created: string[] } | { success: false; error: string }
> {
  const qaEnabled =
    process.env.QA_TOOLS_ENABLED === "true" ||
    process.env.NODE_ENV === "development";

  if (!qaEnabled) {
    return { success: false, error: "Setup não disponível neste ambiente." };
  }

  const created: string[] = [];

  const SA_EMAIL = process.env.QA_SUPER_ADMIN_EMAIL ?? "admin@360growth.com";
  const SA_PASSWORD = process.env.QA_SUPER_ADMIN_PASSWORD ?? "Admin@123456";
  const AGENCY_EMAIL = "agency@demo.com";
  const AGENCY_PASSWORD = "Agency@123456";
  const PORTAL_EMAIL = "portal@demo.com";
  const PORTAL_PASSWORD = "Client@123456";
  const AGENCY_SLUG = "agencia-demo";

  try {
    // ── 1. SUPER_ADMIN ─────────────────────────────────────────────────────
    const saHash = await bcrypt.hash(SA_PASSWORD, 12);
    const [existingSA] = await db.select().from(users).where(eq(users.email, SA_EMAIL)).limit(1);

    if (existingSA) {
      await db.update(users).set({ passwordHash: saHash, role: "SUPER_ADMIN", userStatus: "active", updatedAt: new Date() }).where(eq(users.id, existingSA.id));
    } else {
      await db.insert(users).values({ name: "Admin Demo", email: SA_EMAIL, passwordHash: saHash, role: "SUPER_ADMIN", userStatus: "active" });
      created.push("SUPER_ADMIN");
    }

    // ── 2. Agency ──────────────────────────────────────────────────────────
    const [existingAgency] = await db.select().from(agencies).where(eq(agencies.slug, AGENCY_SLUG)).limit(1);
    let agencyId: string;

    if (existingAgency) {
      agencyId = existingAgency.id;
      await db.update(agencies).set({ name: "Agência Demo", agencyStatus: "active", active: true, updatedAt: new Date() }).where(eq(agencies.id, agencyId));
    } else {
      const [newAgency] = await db.insert(agencies).values({ name: "Agência Demo", slug: AGENCY_SLUG, email: "contato@agenciademo.com", agencyStatus: "active", active: true, maxMembers: 10, maxClients: 100 }).returning();
      agencyId = newAgency.id;
      created.push("Agência Demo");
    }

    // ── 3. Agency Admin ────────────────────────────────────────────────────
    const agencyHash = await bcrypt.hash(AGENCY_PASSWORD, 12);
    const [existingAdmin] = await db.select().from(users).where(eq(users.email, AGENCY_EMAIL)).limit(1);
    let adminUserId: string;

    if (existingAdmin) {
      adminUserId = existingAdmin.id;
      await db.update(users).set({ passwordHash: agencyHash, role: "AGENCY_ADMIN", userStatus: "active", updatedAt: new Date() }).where(eq(users.id, adminUserId));
    } else {
      const [newAdmin] = await db.insert(users).values({ name: "Admin Demo", email: AGENCY_EMAIL, passwordHash: agencyHash, role: "AGENCY_ADMIN", userStatus: "active" }).returning();
      adminUserId = newAdmin.id;
      created.push("agency@demo.com");
    }

    // Ensure agencyUsers link
    const [existingLink] = await db.select().from(agencyUsers).where(eq(agencyUsers.userId, adminUserId)).limit(1);
    if (!existingLink) {
      await db.insert(agencyUsers).values({ agencyId, userId: adminUserId, role: "AGENCY_ADMIN" });
    } else {
      await db.update(agencyUsers).set({ role: "AGENCY_ADMIN", agencyId }).where(eq(agencyUsers.userId, adminUserId));
    }

    // ── 4. Portal User ─────────────────────────────────────────────────────
    const portalHash = await bcrypt.hash(PORTAL_PASSWORD, 12);
    const [existingPortal] = await db.select().from(users).where(eq(users.email, PORTAL_EMAIL)).limit(1);
    let portalUserId: string;

    if (existingPortal) {
      portalUserId = existingPortal.id;
      await db.update(users).set({ passwordHash: portalHash, role: "CLIENT", userStatus: "active", updatedAt: new Date() }).where(eq(users.id, portalUserId));
    } else {
      const [newPortal] = await db.insert(users).values({ name: "Cliente Demo", email: PORTAL_EMAIL, passwordHash: portalHash, role: "CLIENT", userStatus: "active" }).returning();
      portalUserId = newPortal.id;
      created.push("portal@demo.com");
    }

    // ── 5. Client record ───────────────────────────────────────────────────
    const [existingClient] = await db.select().from(clients).where(eq(clients.agencyId, agencyId)).limit(1);
    let clientId: string;

    if (existingClient) {
      clientId = existingClient.id;
      await db.update(clients).set({ name: "Cliente Demo LTDA", email: PORTAL_EMAIL, company: "Cliente Demo LTDA", userId: portalUserId, status: "active", updatedAt: new Date() }).where(eq(clients.id, clientId));
    } else {
      const [newClient] = await db.insert(clients).values({ agencyId, userId: portalUserId, name: "Cliente Demo LTDA", email: PORTAL_EMAIL, company: "Cliente Demo LTDA", status: "active" }).returning();
      clientId = newClient.id;
      created.push("Cliente Demo LTDA");
    }

    // ── 6. Deal ────────────────────────────────────────────────────────────
    const [existingDeal] = await db.select().from(deals).where(eq(deals.agencyId, agencyId)).limit(1);
    if (existingDeal) {
      await db.update(deals).set({ title: "Projeto de Marketing Digital", value: "5000.00", stage: "PROPOSAL", updatedAt: new Date() }).where(eq(deals.id, existingDeal.id));
    } else {
      await db.insert(deals).values({ agencyId, clientId, title: "Projeto de Marketing Digital", value: "5000.00", stage: "PROPOSAL", description: "Gestão de campanhas de performance + SEO" });
      created.push("Deal demo");
    }

    // ── 7. Ticket ──────────────────────────────────────────────────────────
    const [existingTicket] = await db.select().from(tickets).where(eq(tickets.agencyId, agencyId)).limit(1);
    if (existingTicket) {
      await db.update(tickets).set({ subject: "Relatório mensal de performance", status: "OPEN", priority: "MEDIUM", updatedAt: new Date() }).where(eq(tickets.id, existingTicket.id));
    } else {
      await db.insert(tickets).values({ agencyId, clientId, subject: "Relatório mensal de performance", status: "OPEN", priority: "MEDIUM", type: "SUPPORT", createdBy: adminUserId });
      created.push("Ticket demo");
    }

    return {
      success: true,
      created,
      data: {
        superAdmin: { email: SA_EMAIL, password: SA_PASSWORD },
        agencyAdmin: { email: AGENCY_EMAIL, password: AGENCY_PASSWORD },
        portalUser: { email: PORTAL_EMAIL, password: PORTAL_PASSWORD },
        agency: { name: "Agência Demo", slug: AGENCY_SLUG },
      },
    };
  } catch (err) {
    console.error("[setup] bootstrapDemoData error", err);
    return { success: false, error: err instanceof Error ? err.message : "Erro inesperado" };
  }
}
