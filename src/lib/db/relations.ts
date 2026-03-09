import { relations } from "drizzle-orm";
import {
  users,
  accounts,
  sessions,
  agencies,
  agencyUsers,
  clients,
  contacts,
  deals,
  activities,
  auditLogs,
  tickets,
  ticketMessages,
  plans,
  integrations,
  integrationSecrets,
  integrationJobs,
  tasks,
  automationWorkflows,
  dealMessages,
  pipelineStages,
  pipelines,
} from "./schema";

export const usersRelations = relations(users, ({ many }) => ({
  accounts: many(accounts),
  sessions: many(sessions),
  agencyUsers: many(agencyUsers),
  clients: many(clients),
  createdTickets: many(tickets, { relationName: "createdTickets" }),
  assignedTickets: many(tickets, { relationName: "assignedTickets" }),
  ticketMessages: many(ticketMessages),
  responsibleDeals: many(deals),
  activities: many(activities),
  auditLogs: many(auditLogs),
  tasks: many(tasks),
}));

export const accountsRelations = relations(accounts, ({ one }) => ({
  user: one(users, { fields: [accounts.userId], references: [users.id] }),
}));

export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, { fields: [sessions.userId], references: [users.id] }),
}));

export const plansRelations = relations(plans, ({ many }) => ({
  agencies: many(agencies),
}));

export const agenciesRelations = relations(agencies, ({ one, many }) => ({
  plan: one(plans, { fields: [agencies.planId], references: [plans.id] }),
  agencyUsers: many(agencyUsers),
  clients: many(clients),
  deals: many(deals),
  tickets: many(tickets),
  activities: many(activities),
  auditLogs: many(auditLogs),
  integrations: many(integrations),
  tasks: many(tasks),
  automationWorkflows: many(automationWorkflows),
}));

export const agencyUsersRelations = relations(agencyUsers, ({ one }) => ({
  agency: one(agencies, {
    fields: [agencyUsers.agencyId],
    references: [agencies.id],
  }),
  user: one(users, { fields: [agencyUsers.userId], references: [users.id] }),
}));

export const clientsRelations = relations(clients, ({ one, many }) => ({
  agency: one(agencies, {
    fields: [clients.agencyId],
    references: [agencies.id],
  }),
  user: one(users, { fields: [clients.userId], references: [users.id] }),
  contacts: many(contacts),
  deals: many(deals),
  tickets: many(tickets),
}));

export const contactsRelations = relations(contacts, ({ one }) => ({
  agency: one(agencies, {
    fields: [contacts.agencyId],
    references: [agencies.id],
  }),
  client: one(clients, {
    fields: [contacts.clientId],
    references: [clients.id],
  }),
}));

export const dealsRelations = relations(deals, ({ one, many }) => ({
  agency: one(agencies, {
    fields: [deals.agencyId],
    references: [agencies.id],
  }),
  client: one(clients, {
    fields: [deals.clientId],
    references: [clients.id],
  }),
  responsible: one(users, {
    fields: [deals.responsibleId],
    references: [users.id],
  }),
  stage: one(pipelineStages, {
    fields: [deals.stageId],
    references: [pipelineStages.id],
  }),
  pipeline: one(pipelines, {
    fields: [deals.pipelineId],
    references: [pipelines.id],
  }),
  activities: many(activities),
  messages: many(dealMessages),
}));

export const dealMessagesRelations = relations(dealMessages, ({ one }) => ({
  deal: one(deals, {
    fields: [dealMessages.dealId],
    references: [deals.id],
  }),
}));

export const activitiesRelations = relations(activities, ({ one }) => ({
  agency: one(agencies, {
    fields: [activities.agencyId],
    references: [agencies.id],
  }),
  user: one(users, { fields: [activities.userId], references: [users.id] }),
  deal: one(deals, { fields: [activities.entityId], references: [deals.id] }),
}));

export const ticketsRelations = relations(tickets, ({ one, many }) => ({
  agency: one(agencies, {
    fields: [tickets.agencyId],
    references: [agencies.id],
  }),
  client: one(clients, {
    fields: [tickets.clientId],
    references: [clients.id],
  }),
  creator: one(users, {
    fields: [tickets.createdBy],
    references: [users.id],
    relationName: "createdTickets",
  }),
  assignedUser: one(users, {
    fields: [tickets.assignedTo],
    references: [users.id],
    relationName: "assignedTickets",
  }),
  messages: many(ticketMessages),
}));

export const ticketMessagesRelations = relations(ticketMessages, ({ one }) => ({
  ticket: one(tickets, {
    fields: [ticketMessages.ticketId],
    references: [tickets.id],
  }),
  user: one(users, {
    fields: [ticketMessages.userId],
    references: [users.id],
  }),
}));

export const auditLogsRelations = relations(auditLogs, ({ one }) => ({
  agency: one(agencies, {
    fields: [auditLogs.agencyId],
    references: [agencies.id],
  }),
  user: one(users, {
    fields: [auditLogs.userId],
    references: [users.id],
  }),
}));

export const integrationsRelations = relations(integrations, ({ one, many }) => ({
  agency: one(agencies, {
    fields: [integrations.agencyId],
    references: [agencies.id],
  }),
  secret: one(integrationSecrets, {
    fields: [integrations.secretId],
    references: [integrationSecrets.id],
  }),
  jobs: many(integrationJobs),
}));

export const integrationSecretsRelations = relations(
  integrationSecrets,
  ({ many }) => ({
    integrations: many(integrations),
  })
);

export const integrationJobsRelations = relations(integrationJobs, ({ one }) => ({
  integration: one(integrations, {
    fields: [integrationJobs.integrationId],
    references: [integrations.id],
  }),
}));

export const tasksRelations = relations(tasks, ({ one }) => ({
  agency: one(agencies, {
    fields: [tasks.agencyId],
    references: [agencies.id],
  }),
  responsible: one(users, {
    fields: [tasks.responsibleId],
    references: [users.id],
  }),
}));

export const automationWorkflowsRelations = relations(
  automationWorkflows,
  ({ one }) => ({
    agency: one(agencies, {
      fields: [automationWorkflows.agencyId],
      references: [agencies.id],
    }),
  })
);
export const pipelineStagesRelations = relations(pipelineStages, ({ one, many }) => ({
  pipeline: one(pipelines, {
    fields: [pipelineStages.pipelineId],
    references: [pipelines.id],
  }),
  deals: many(deals),
}));

export const pipelinesRelations = relations(pipelines, ({ one, many }) => ({
  agency: one(agencies, {
    fields: [pipelines.agencyId],
    references: [agencies.id],
  }),
  client: one(clients, {
    fields: [pipelines.clientId],
    references: [clients.id],
  }),
  stages: many(pipelineStages),
  deals: many(deals),
}));
