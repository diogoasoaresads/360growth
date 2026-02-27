import {
  pgTable,
  text,
  timestamp,
  boolean,
  integer,
  decimal,
  primaryKey,
  index,
  json,
} from "drizzle-orm/pg-core";
import type { AdapterAccountType } from "next-auth/adapters";

// ============================================================
// ENUMS
// ============================================================
export type UserRole = "SUPER_ADMIN" | "AGENCY_ADMIN" | "AGENCY_MEMBER" | "CLIENT";
export type UserStatus = "active" | "inactive" | "suspended";
export type AgencyUserRole = "AGENCY_ADMIN" | "AGENCY_MEMBER";
export type AgencyStatus = "active" | "suspended" | "trial" | "cancelled" | "deleted";
export type DealStage = "LEAD" | "QUALIFIED" | "PROPOSAL" | "NEGOTIATION" | "CLOSED_WON" | "CLOSED_LOST";
export type ActivityType = "NOTE" | "CALL" | "EMAIL" | "MEETING" | "TASK" | "STATUS_CHANGE";
export type EntityType = "CLIENT" | "DEAL" | "TICKET" | "CONTACT" | "AGENCY" | "PLAN" | "USER";
export type TicketStatus = "OPEN" | "IN_PROGRESS" | "WAITING" | "RESOLVED" | "CLOSED";
export type TicketPriority = "LOW" | "MEDIUM" | "HIGH" | "URGENT";
export type TicketType = "SUPPORT" | "FEATURE_REQUEST" | "BUG" | "BILLING" | "OTHER";

export interface PlanFeatures {
  maxMembers: number;
  maxClients: number;
  maxPipelines: number;
  maxTicketsMonth: number;
  customDomain: boolean;
  apiAccess: boolean;
  prioritySupport: boolean;
  whiteLabel: boolean;
  advancedReports: boolean;
}

export const DEFAULT_PLAN_FEATURES: PlanFeatures = {
  maxMembers: 5,
  maxClients: 50,
  maxPipelines: 1,
  maxTicketsMonth: 100,
  customDomain: false,
  apiAccess: false,
  prioritySupport: false,
  whiteLabel: false,
  advancedReports: false,
};

// ============================================================
// USERS
// ============================================================
export const users = pgTable("users", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text("name"),
  email: text("email").notNull().unique(),
  emailVerified: timestamp("email_verified", { mode: "date" }),
  image: text("image"),
  passwordHash: text("password_hash"),
  role: text("role").$type<UserRole>().notNull().default("CLIENT"),
  userStatus: text("user_status").$type<UserStatus>().notNull().default("active"),
  lastLoginAt: timestamp("last_login_at", { mode: "date" }),
  createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { mode: "date" }).notNull().defaultNow(),
});

// ============================================================
// NEXTAUTH TABLES
// ============================================================
export const accounts = pgTable(
  "accounts",
  {
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: text("type").$type<AdapterAccountType>().notNull(),
    provider: text("provider").notNull(),
    providerAccountId: text("provider_account_id").notNull(),
    refresh_token: text("refresh_token"),
    access_token: text("access_token"),
    expires_at: integer("expires_at"),
    token_type: text("token_type"),
    scope: text("scope"),
    id_token: text("id_token"),
    session_state: text("session_state"),
  },
  (account) => [
    primaryKey({ columns: [account.provider, account.providerAccountId] }),
  ]
);

export const sessions = pgTable("sessions", {
  sessionToken: text("session_token").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expires: timestamp("expires", { mode: "date" }).notNull(),
});

export const verificationTokens = pgTable(
  "verification_tokens",
  {
    identifier: text("identifier").notNull(),
    token: text("token").notNull(),
    expires: timestamp("expires", { mode: "date" }).notNull(),
  },
  (vt) => [primaryKey({ columns: [vt.identifier, vt.token] })]
);

// ============================================================
// PLANS
// ============================================================
export const plans = pgTable("plans", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text("name").notNull(),
  slug: text("slug").unique(),
  description: text("description"),
  maxClients: integer("max_clients").notNull().default(10),
  maxUsers: integer("max_users").notNull().default(3),
  priceMonthly: decimal("price_monthly", { precision: 10, scale: 2 }).notNull().default("0"),
  priceYearly: decimal("price_yearly", { precision: 10, scale: 2 }).notNull().default("0"),
  stripePriceId: text("stripe_price_id"),
  stripePriceIdYearly: text("stripe_price_id_yearly"),
  featuresConfig: json("features_config").$type<PlanFeatures>(),
  features: text("features").array(),
  isActive: boolean("is_active").notNull().default(true),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { mode: "date" }).notNull().defaultNow(),
});

// ============================================================
// AGENCIES
// ============================================================
export const agencies = pgTable("agencies", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  email: text("email"),
  phone: text("phone"),
  planId: text("plan_id").references(() => plans.id),
  stripeCustomerId: text("stripe_customer_id"),
  stripeSubscriptionId: text("stripe_subscription_id"),
  subscriptionStatus: text("subscription_status").default("inactive"),
  trialEndsAt: timestamp("trial_ends_at", { mode: "date" }),
  active: boolean("active").notNull().default(true),
  agencyStatus: text("agency_status").$type<AgencyStatus>().notNull().default("trial"),
  maxMembers: integer("max_members").notNull().default(5),
  maxClients: integer("max_clients").notNull().default(50),
  logo: text("logo"),
  website: text("website"),
  deletedAt: timestamp("deleted_at", { mode: "date" }),
  createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { mode: "date" }).notNull().defaultNow(),
});

// ============================================================
// AGENCY USERS
// ============================================================
export const agencyUsers = pgTable(
  "agency_users",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    agencyId: text("agency_id")
      .notNull()
      .references(() => agencies.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    role: text("role").$type<AgencyUserRole>().notNull().default("AGENCY_MEMBER"),
    createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
  },
  (t) => [index("agency_users_agency_id_idx").on(t.agencyId)]
);

// ============================================================
// CLIENTS
// ============================================================
export const clients = pgTable(
  "clients",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    agencyId: text("agency_id")
      .notNull()
      .references(() => agencies.id, { onDelete: "cascade" }),
    userId: text("user_id").references(() => users.id, { onDelete: "set null" }),
    name: text("name").notNull(),
    email: text("email").notNull(),
    phone: text("phone"),
    company: text("company"),
    tags: text("tags").array(),
    notes: text("notes"),
    status: text("status").notNull().default("active"),
    avatarUrl: text("avatar_url"),
    createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { mode: "date" }).notNull().defaultNow(),
  },
  (t) => [index("clients_agency_id_idx").on(t.agencyId)]
);

// ============================================================
// CONTACTS
// ============================================================
export const contacts = pgTable(
  "contacts",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    agencyId: text("agency_id")
      .notNull()
      .references(() => agencies.id, { onDelete: "cascade" }),
    clientId: text("client_id")
      .notNull()
      .references(() => clients.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    email: text("email"),
    phone: text("phone"),
    position: text("position"),
    isPrimary: boolean("is_primary").notNull().default(false),
    createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
  },
  (t) => [index("contacts_client_id_idx").on(t.clientId)]
);

// ============================================================
// DEALS
// ============================================================
export const deals = pgTable(
  "deals",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    agencyId: text("agency_id")
      .notNull()
      .references(() => agencies.id, { onDelete: "cascade" }),
    clientId: text("client_id")
      .notNull()
      .references(() => clients.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    value: decimal("value", { precision: 12, scale: 2 }),
    stage: text("stage").$type<DealStage>().notNull().default("LEAD"),
    responsibleId: text("responsible_id").references(() => users.id, { onDelete: "set null" }),
    dueDate: timestamp("due_date", { mode: "date" }),
    description: text("description"),
    probability: integer("probability").default(0),
    createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { mode: "date" }).notNull().defaultNow(),
  },
  (t) => [
    index("deals_agency_id_idx").on(t.agencyId),
    index("deals_stage_idx").on(t.stage),
  ]
);

// ============================================================
// ACTIVITIES
// ============================================================
export const activities = pgTable(
  "activities",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    agencyId: text("agency_id")
      .notNull()
      .references(() => agencies.id, { onDelete: "cascade" }),
    entityType: text("entity_type").$type<EntityType>().notNull(),
    entityId: text("entity_id").notNull(),
    userId: text("user_id").references(() => users.id, { onDelete: "set null" }),
    type: text("type").$type<ActivityType>().notNull(),
    description: text("description").notNull(),
    metadata: text("metadata"),
    createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
  },
  (t) => [
    index("activities_entity_idx").on(t.entityType, t.entityId),
    index("activities_agency_id_idx").on(t.agencyId),
  ]
);

// ============================================================
// AUDIT LOGS
// ============================================================
export const auditLogs = pgTable(
  "audit_logs",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    agencyId: text("agency_id").references(() => agencies.id, { onDelete: "set null" }),
    userId: text("user_id").references(() => users.id, { onDelete: "set null" }),
    action: text("action").notNull(),
    entityType: text("entity_type").$type<EntityType>(),
    entityId: text("entity_id"),
    metadata: json("metadata"),
    ipAddress: text("ip_address"),
    createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
  },
  (t) => [
    index("audit_logs_agency_id_idx").on(t.agencyId),
    index("audit_logs_created_at_idx").on(t.createdAt),
  ]
);

// ============================================================
// TICKETS
// ============================================================
export const tickets = pgTable(
  "tickets",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    agencyId: text("agency_id")
      .notNull()
      .references(() => agencies.id, { onDelete: "cascade" }),
    clientId: text("client_id")
      .notNull()
      .references(() => clients.id, { onDelete: "cascade" }),
    subject: text("subject").notNull(),
    status: text("status").$type<TicketStatus>().notNull().default("OPEN"),
    priority: text("priority").$type<TicketPriority>().notNull().default("MEDIUM"),
    type: text("type").$type<TicketType>().notNull().default("SUPPORT"),
    createdBy: text("created_by").notNull().references(() => users.id),
    assignedTo: text("assigned_to").references(() => users.id, { onDelete: "set null" }),
    resolvedAt: timestamp("resolved_at", { mode: "date" }),
    createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { mode: "date" }).notNull().defaultNow(),
  },
  (t) => [
    index("tickets_agency_id_idx").on(t.agencyId),
    index("tickets_status_idx").on(t.status),
    index("tickets_client_id_idx").on(t.clientId),
  ]
);

// ============================================================
// TICKET MESSAGES
// ============================================================
export const ticketMessages = pgTable(
  "ticket_messages",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    ticketId: text("ticket_id")
      .notNull()
      .references(() => tickets.id, { onDelete: "cascade" }),
    userId: text("user_id").notNull().references(() => users.id),
    content: text("content").notNull(),
    isInternal: boolean("is_internal").notNull().default(false),
    attachments: text("attachments").array(),
    createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
  },
  (t) => [index("ticket_messages_ticket_id_idx").on(t.ticketId)]
);

// ============================================================
// TYPE EXPORTS
// ============================================================
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Agency = typeof agencies.$inferSelect;
export type NewAgency = typeof agencies.$inferInsert;
export type AgencyUser = typeof agencyUsers.$inferSelect;
export type Client = typeof clients.$inferSelect;
export type NewClient = typeof clients.$inferInsert;
export type Contact = typeof contacts.$inferSelect;
export type Deal = typeof deals.$inferSelect;
export type NewDeal = typeof deals.$inferInsert;
export type Activity = typeof activities.$inferSelect;
export type AuditLog = typeof auditLogs.$inferSelect;
export type Ticket = typeof tickets.$inferSelect;
export type NewTicket = typeof tickets.$inferInsert;
export type TicketMessage = typeof ticketMessages.$inferSelect;
export type Plan = typeof plans.$inferSelect;
export type NewPlan = typeof plans.$inferInsert;

// ============================================================
// HELPERS
// ============================================================
export function getAgencyDisplayStatus(
  agency: Pick<Agency, "active" | "agencyStatus" | "deletedAt">
): AgencyStatus {
  if (agency.deletedAt) return "deleted";
  return agency.agencyStatus ?? (agency.active ? "active" : "suspended");
}
