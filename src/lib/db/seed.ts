import { loadEnvConfig } from "@next/env";
loadEnvConfig(process.cwd());

import { db } from "./index";
import {
  plans,
  users,
  agencies,
  agencyUsers,
  clients,
  contacts,
  deals,
  activities,
  auditLogs,
  platformSettings,
  tickets,
  ticketMessages,
  sessions,
  accounts,
  userContexts,
  integrations,
} from "./schema";
import type { PlanFeatures, BillingStatus } from "./schema";
import { hash } from "bcryptjs";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function randomPastDate(maxDaysAgo = 30, minDaysAgo = 0): Date {
  const d = new Date();
  const days =
    minDaysAgo + Math.floor(Math.random() * Math.max(1, maxDaysAgo - minDaysAgo));
  d.setDate(d.getDate() - days);
  d.setHours(
    Math.floor(Math.random() * 23),
    Math.floor(Math.random() * 59),
    Math.floor(Math.random() * 59)
  );
  return d;
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]!;
}

// ─── Plan data ────────────────────────────────────────────────────────────────

const PLAN_DATA = [
  {
    name: "Starter",
    slug: "starter",
    description: "Ideal para agências em início de jornada",
    priceMonthly: "97.00",
    priceYearly: "970.00",
    maxUsers: 3,
    maxClients: 50,
    sortOrder: 1,
    features: ["Até 3 membros", "50 clientes", "2 pipelines", "100 tickets/mês"],
    featuresConfig: {
      maxMembers: 3,
      maxClients: 50,
      maxPipelines: 2,
      maxTicketsMonth: 100,
      customDomain: false,
      apiAccess: false,
      prioritySupport: false,
      whiteLabel: false,
      advancedReports: false,
    } satisfies PlanFeatures,
  },
  {
    name: "Growth",
    slug: "growth",
    description: "Para agências em crescimento acelerado",
    priceMonthly: "197.00",
    priceYearly: "1970.00",
    maxUsers: 10,
    maxClients: 200,
    sortOrder: 2,
    features: [
      "Até 10 membros",
      "200 clientes",
      "5 pipelines",
      "500 tickets/mês",
      "Acesso à API",
      "Relatórios avançados",
    ],
    featuresConfig: {
      maxMembers: 10,
      maxClients: 200,
      maxPipelines: 5,
      maxTicketsMonth: 500,
      customDomain: false,
      apiAccess: true,
      prioritySupport: false,
      whiteLabel: false,
      advancedReports: true,
    } satisfies PlanFeatures,
  },
  {
    name: "Pro",
    slug: "pro",
    description: "Para agências profissionais que precisam de mais poder",
    priceMonthly: "397.00",
    priceYearly: "3970.00",
    maxUsers: 25,
    maxClients: 500,
    sortOrder: 3,
    features: [
      "Até 25 membros",
      "500 clientes",
      "15 pipelines",
      "2000 tickets/mês",
      "Domínio customizado",
      "Acesso à API",
      "Suporte prioritário",
      "Relatórios avançados",
    ],
    featuresConfig: {
      maxMembers: 25,
      maxClients: 500,
      maxPipelines: 15,
      maxTicketsMonth: 2000,
      customDomain: true,
      apiAccess: true,
      prioritySupport: true,
      whiteLabel: false,
      advancedReports: true,
    } satisfies PlanFeatures,
  },
  {
    name: "Enterprise",
    slug: "enterprise",
    description: "Solução completa sem limites para grandes agências",
    priceMonthly: "797.00",
    priceYearly: "7970.00",
    maxUsers: 999,
    maxClients: 9999,
    sortOrder: 4,
    features: [
      "Membros ilimitados",
      "Clientes ilimitados",
      "Pipelines ilimitados",
      "Tickets ilimitados",
      "Domínio customizado",
      "Acesso à API",
      "Suporte prioritário",
      "White label",
      "Relatórios avançados",
    ],
    featuresConfig: {
      maxMembers: -1,
      maxClients: -1,
      maxPipelines: -1,
      maxTicketsMonth: -1,
      customDomain: true,
      apiAccess: true,
      prioritySupport: true,
      whiteLabel: true,
      advancedReports: true,
    } satisfies PlanFeatures,
  },
] as const;

// ─── Agency data ──────────────────────────────────────────────────────────────

const AGENCY_DATA = [
  {
    name: "Acme Digital",
    slug: "acme-digital",
    planSlug: "pro",
    agencyStatus: "active" as const,
    billingStatus: "active",
    adminName: "Ana Souza",
    memberNames: ["João Silva", "Maria Oliveira", "Rafael Santos"],
    clientCount: 12,
  },
  {
    name: "WebPro Agency",
    slug: "webpro",
    planSlug: "growth",
    agencyStatus: "active" as const,
    billingStatus: "active",
    adminName: "Pedro Costa",
    memberNames: ["Fernanda Alves", "Lucas Rocha"],
    clientCount: 10,
  },
  {
    name: "StartUp Lab",
    slug: "startup-lab",
    planSlug: "starter",
    agencyStatus: "trial" as const,
    billingStatus: "trial",
    adminName: "Julia Ferreira",
    memberNames: ["Gabriel Martins"],
    clientCount: 5,
  },
  {
    name: "Creative House",
    slug: "creative-house",
    planSlug: "enterprise",
    agencyStatus: "active" as const,
    billingStatus: "active",
    adminName: "Carlos Mendes",
    memberNames: ["Camila Rodrigues", "Eduardo Nascimento", "Isabela Carvalho"],
    clientCount: 15,
  },
  {
    name: "Old Marketing",
    slug: "old-marketing",
    planSlug: "starter",
    agencyStatus: "suspended" as const,
    billingStatus: "trial",
    adminName: "Beatriz Lima",
    memberNames: [],
    clientCount: 0,
  },
] as const;

// ─── Client company names ─────────────────────────────────────────────────────

const CLIENT_COMPANIES = [
  "Tech Solutions LTDA",
  "Grupo Varejo Plus",
  "Construtora Horizonte",
  "Moda Fashion Store",
  "Restaurante Sabor & Arte",
  "Auto Peças Central",
  "Clínica Saúde Total",
  "Academia Fitness Pro",
  "Escola Digital Saber",
  "Hotel Paraíso Beira-Mar",
  "Farmácia Bem-Estar",
  "Petshop Amigos Fiéis",
  "Imobiliária Casa Minha",
  "Contabilidade & Gestão",
  "Oficina Mecânica Rápida",
];

// ─── Ticket data ──────────────────────────────────────────────────────────────

const TICKET_DATA = [
  {
    subject: "Não consigo acessar o pipeline de vendas",
    priority: "HIGH" as const,
    status: "OPEN" as const,
    type: "SUPPORT" as const,
    messages: [
      "Olá, estou tentando acessar o pipeline de vendas mas aparece uma mensagem de erro 403. Já tentei relogar mas o problema persiste.",
      "Entendemos o problema. Pode nos informar qual navegador está usando e enviar um print do erro para analisarmos?",
    ],
  },
  {
    subject: "Como faço para adicionar mais membros?",
    priority: "MEDIUM" as const,
    status: "IN_PROGRESS" as const,
    type: "SUPPORT" as const,
    messages: [
      "Gostaria de adicionar 2 novos membros à minha equipe mas não encontro onde fazer isso no painel.",
      "Para adicionar membros, acesse Configurações > Equipe > Convidar Membro. Você tem vagas disponíveis no plano atual.",
      "Encontrei! Mas quando clico em Convidar, diz que atingi o limite. Meu plano tem quantos membros?",
    ],
  },
  {
    subject: "Erro ao exportar relatório em PDF",
    priority: "HIGH" as const,
    status: "OPEN" as const,
    type: "BUG" as const,
    messages: [
      "Ao tentar exportar o relatório mensal em PDF, o download não inicia e fica carregando indefinidamente. Testei em Chrome e Firefox.",
    ],
  },
  {
    subject: "Solicitação de upgrade para o plano Pro",
    priority: "LOW" as const,
    status: "RESOLVED" as const,
    type: "BILLING" as const,
    messages: [
      "Gostaria de fazer upgrade do Growth para o Pro. Como funciona a cobrança proporcional?",
      "Ótimo! O upgrade é proporcional ao período restante do mês. O valor adicional será cobrado na próxima fatura. Posso processar agora?",
      "Sim, pode processar! Muito obrigado pela agilidade.",
      "Upgrade realizado com sucesso! Suas novas funcionalidades já estão disponíveis.",
    ],
  },
  {
    subject: "Integração com WhatsApp Business",
    priority: "MEDIUM" as const,
    status: "WAITING" as const,
    type: "FEATURE_REQUEST" as const,
    messages: [
      "É possível integrar o sistema com o WhatsApp Business para envio automático de notificações para clientes?",
      "Ótima sugestão! Esta funcionalidade está no nosso roadmap. Pode nos contar mais sobre seu caso de uso?",
      "Precisamos enviar notificações de status de ticket e lembretes de reunião automaticamente para os clientes.",
      "Anotado! Adicionamos ao backlog de integrações. Qual seria a urgência para vocês?",
    ],
  },
  {
    subject: "Problema com login de cliente do portal",
    priority: "URGENT" as const,
    status: "OPEN" as const,
    type: "SUPPORT" as const,
    messages: [
      "Um de nossos clientes não consegue acessar o portal. Ele recebe a mensagem 'Email ou senha inválidos' mas tenho certeza que as credenciais estão corretas.",
    ],
  },
  {
    subject: "Configuração de domínio customizado",
    priority: "LOW" as const,
    status: "CLOSED" as const,
    type: "SUPPORT" as const,
    messages: [
      "Como faço para configurar nosso domínio próprio no sistema?",
      "Para configurar domínio customizado (disponível no plano Pro e Enterprise), acesse Configurações > Domínio e adicione um CNAME no seu DNS.",
      "Segui os passos e deu certo! Muito obrigado.",
      "Ótimo! Qualquer dúvida estamos à disposição.",
    ],
  },
  {
    subject: "Dashboard não carrega as métricas",
    priority: "HIGH" as const,
    status: "IN_PROGRESS" as const,
    type: "BUG" as const,
    messages: [
      "O dashboard principal está carregando em branco, sem nenhuma métrica. O spinner fica rodando mas nunca exibe os dados.",
      "Identificamos o problema — havia um timeout na consulta de dados históricos. Estamos aplicando um patch. Tente novamente em 30 minutos?",
    ],
  },
  {
    subject: "Solicitação para limpar dados de teste",
    priority: "LOW" as const,
    status: "RESOLVED" as const,
    type: "OTHER" as const,
    messages: [
      "Durante a fase de testes criamos vários clientes e deals fictícios. Como fazemos para limpar apenas esses dados?",
      "Você pode usar a função de exclusão em massa na listagem. Filtre por 'teste' no campo de busca e use seleção múltipla para deletar. Quer que façamos isso por vocês?",
      "Conseguimos fazer aqui mesmo, obrigado!",
    ],
  },
  {
    subject: "Cobranças duplicadas na fatura",
    priority: "URGENT" as const,
    status: "IN_PROGRESS" as const,
    type: "BILLING" as const,
    messages: [
      "Recebi uma fatura com duas cobranças do mesmo plano no mesmo mês. O valor veio duplicado.",
      "Pedimos desculpas pelo transtorno! Identificamos o problema — houve duplicação no processamento. Estamos gerando um crédito para sua próxima fatura.",
      "Obrigada! Quando aparecerá o crédito?",
      "O crédito será aplicado automaticamente na próxima fatura. Você receberá um email de confirmação em breve.",
    ],
  },
];

// ─── Platform settings defaults ───────────────────────────────────────────────

const DEFAULT_SETTINGS = [
  { key: "general.platformName", value: JSON.stringify("360growth") },
  { key: "general.platformUrl", value: JSON.stringify("") },
  { key: "general.primaryColor", value: JSON.stringify("#6366f1") },
  {
    key: "general.description",
    value: JSON.stringify("Plataforma completa para gestão de agências digitais"),
  },
  { key: "email.senderEmail", value: JSON.stringify("noreply@360growth.com") },
  { key: "email.senderName", value: JSON.stringify("360growth") },
  { key: "limits.defaultTrialDays", value: JSON.stringify(14) },
  { key: "limits.maxUploadMb", value: JSON.stringify(500) },
  { key: "limits.maxConcurrentSessions", value: JSON.stringify(3) },
  { key: "security.enforce2FA", value: JSON.stringify(false) },
  { key: "security.sessionExpirationHours", value: JSON.stringify(24) },
  { key: "security.maxLoginAttempts", value: JSON.stringify(5) },
  { key: "security.lockoutMinutes", value: JSON.stringify(30) },
  { key: "maintenance.enabled", value: JSON.stringify(false) },
  {
    key: "maintenance.message",
    value: JSON.stringify("Estamos em manutenção. Voltaremos em breve."),
  },
  { key: "maintenance.estimatedReturn", value: JSON.stringify("") },
];

// ─── Main seed function ───────────────────────────────────────────────────────

async function seed() {
  console.log("🌱 Iniciando seed...");

  // ── Clear data ──────────────────────────────────────────────────────────────
  console.log("🗑️  Limpando dados existentes...");
  await db.delete(auditLogs);
  await db.delete(platformSettings);
  await db.delete(ticketMessages);
  await db.delete(tickets);
  await db.delete(deals);
  await db.delete(contacts);
  await db.delete(clients);
  await db.delete(activities);
  await db.delete(agencyUsers);
  await db.delete(sessions);
  await db.delete(accounts);
  await db.delete(agencies);
  await db.delete(users);
  await db.delete(plans);

  // ── Plans ───────────────────────────────────────────────────────────────────
  console.log("📋 Criando planos...");
  const planMap: Record<string, typeof plans.$inferSelect> = {};
  for (const p of PLAN_DATA) {
    const [plan] = await db
      .insert(plans)
      .values({
        name: p.name,
        slug: p.slug,
        description: p.description,
        priceMonthly: p.priceMonthly,
        priceYearly: p.priceYearly,
        maxUsers: p.maxUsers,
        maxClients: p.maxClients,
        featuresConfig: p.featuresConfig,
        features: p.features as unknown as string[],
        isActive: true,
        sortOrder: p.sortOrder,
      })
      .returning();
    planMap[p.slug] = plan!;
  }

  // ── Super Admin ─────────────────────────────────────────────────────────────
  console.log("👤 Criando Super Admin...");
  const superAdminPw = await hash("Admin@123456", 12);
  const [superAdmin] = await db
    .insert(users)
    .values({
      name: "Super Admin",
      email: "admin@360growth.com",
      passwordHash: superAdminPw,
      role: "SUPER_ADMIN",
      userStatus: "active",
      emailVerified: new Date(),
      createdAt: randomPastDate(60, 50),
    })
    .returning();
  const admin = superAdmin!;

  // ── Agencies + their users ──────────────────────────────────────────────────
  console.log("🏢 Criando agências e usuários...");

  const agencyPw = await hash("Agency@123456", 12);
  const createdAgencies: (typeof agencies.$inferSelect)[] = [];
  const agencyAdmins: (typeof users.$inferSelect)[] = [];
  const clientsByAgency: Record<string, (typeof clients.$inferSelect)[]> = {};

  for (const a of AGENCY_DATA) {
    const plan = planMap[a.planSlug]!;
    const agencyCreatedAt = randomPastDate(28, 5);

    const trialEndsAt =
      a.agencyStatus === "trial"
        ? new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)
        : null;

    // Create agency
    const [agency] = await db
      .insert(agencies)
      .values({
        name: a.name,
        slug: a.slug,
        planId: plan.id,
        agencyStatus: a.agencyStatus,
        active: a.agencyStatus !== "suspended",
        billingStatus: a.billingStatus as BillingStatus,
        trialEndsAt,
        maxMembers: plan.maxUsers,
        maxClients: plan.maxClients,
        createdAt: agencyCreatedAt,
        updatedAt: agencyCreatedAt,
      })
      .returning();
    createdAgencies.push(agency!);

    // Create agency admin
    const [adminUser] = await db
      .insert(users)
      .values({
        name: a.adminName,
        email: `admin@${a.slug}.com`,
        passwordHash: agencyPw,
        role: "AGENCY_ADMIN",
        userStatus: a.agencyStatus === "suspended" ? "suspended" : "active",
        emailVerified: new Date(),
        createdAt: agencyCreatedAt,
        updatedAt: agencyCreatedAt,
      })
      .returning();
    agencyAdmins.push(adminUser!);

    await db.insert(agencyUsers).values({
      agencyId: agency!.id,
      userId: adminUser!.id,
      role: "AGENCY_ADMIN",
      createdAt: agencyCreatedAt,
    });

    // Create agency members
    for (const memberName of a.memberNames) {
      const memberSlug = memberName
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/\s+/g, ".");
      const [member] = await db
        .insert(users)
        .values({
          name: memberName,
          email: `${memberSlug}@${a.slug}.com`,
          passwordHash: agencyPw,
          role: "AGENCY_MEMBER",
          userStatus: "active",
          emailVerified: new Date(),
          createdAt: agencyCreatedAt,
          updatedAt: agencyCreatedAt,
        })
        .returning();

      await db.insert(agencyUsers).values({
        agencyId: agency!.id,
        userId: member!.id,
        role: "AGENCY_MEMBER",
        createdAt: agencyCreatedAt,
      });
    }
  }

  // ── Clients ─────────────────────────────────────────────────────────────────
  console.log("👥 Criando clientes...");

  for (let ai = 0; ai < AGENCY_DATA.length; ai++) {
    const a = AGENCY_DATA[ai];
    const agency = createdAgencies[ai]!;

    if (a.clientCount === 0) continue;

    clientsByAgency[agency.id] = [];

    for (let ci = 0; ci < a.clientCount; ci++) {
      const company = CLIENT_COMPANIES[ci % CLIENT_COMPANIES.length]!;
      const [client] = await db
        .insert(clients)
        .values({
          agencyId: agency.id,
          name: company,
          email: `contato${ci + 1}@${a.slug}.client.com`,
          company,
          status: "active",
          phone: `(${11 + ai}) 9${8000 + ci}-${1000 + ci}`,
          createdAt: randomPastDate(20, 1),
          updatedAt: new Date(),
        })
        .returning();
      clientsByAgency[agency.id]!.push(client!);
    }
  }

  // ── Tickets ─────────────────────────────────────────────────────────────────
  console.log("🎫 Criando tickets...");

  const createdTickets: (typeof tickets.$inferSelect)[] = [];

  // Use the 4 agencies that have clients
  const activeAgencies = createdAgencies.slice(0, 4);

  for (let ti = 0; ti < TICKET_DATA.length; ti++) {
    const td = TICKET_DATA[ti]!;
    const agencyIndex = ti % activeAgencies.length;
    const agency = activeAgencies[agencyIndex]!;
    const agencyAdmin = agencyAdmins[agencyIndex]!;
    const agencyClients = clientsByAgency[agency.id] ?? [];

    if (agencyClients.length === 0) continue;

    const client = agencyClients[ti % agencyClients.length]!;
    const ticketCreatedAt = randomPastDate(20, 1);

    const [ticket] = await db
      .insert(tickets)
      .values({
        agencyId: agency.id,
        clientId: client.id,
        subject: td.subject,
        status: td.status,
        priority: td.priority,
        type: td.type,
        createdBy: agencyAdmin.id,
        assignedTo: ti % 3 === 0 ? admin.id : null,
        resolvedAt:
          td.status === "RESOLVED" || td.status === "CLOSED"
            ? new Date(ticketCreatedAt.getTime() + 3 * 24 * 60 * 60 * 1000)
            : null,
        createdAt: ticketCreatedAt,
        updatedAt: ticketCreatedAt,
      })
      .returning();
    createdTickets.push(ticket!);

    // Create messages alternating between agency admin and super admin
    for (let mi = 0; mi < td.messages.length; mi++) {
      const isAdminReply = mi % 2 === 1; // odd index = super admin reply
      const messageUserId = isAdminReply ? admin.id : agencyAdmin.id;
      const messageDate = new Date(
        ticketCreatedAt.getTime() + (mi + 1) * 2 * 60 * 60 * 1000 // +2h per message
      );

      await db.insert(ticketMessages).values({
        ticketId: ticket!.id,
        userId: messageUserId,
        content: td.messages[mi]!,
        isInternal: false,
        createdAt: messageDate,
      });
    }
  }

  // ── Audit Logs ──────────────────────────────────────────────────────────────
  console.log("📝 Criando audit logs...");

  type NewAuditLog = typeof auditLogs.$inferInsert;
  const logEntries: NewAuditLog[] = [];

  // Agency created
  for (let i = 0; i < createdAgencies.length; i++) {
    const agency = createdAgencies[i]!;
    logEntries.push({
      userId: admin.id,
      action: "agency.created",
      entityType: "AGENCY",
      entityId: agency.id,
      metadata: { name: agency.name, slug: agency.slug },
      createdAt: agency.createdAt,
    });
  }

  // User created (agency admins)
  for (let i = 0; i < agencyAdmins.length; i++) {
    const u = agencyAdmins[i]!;
    logEntries.push({
      userId: admin.id,
      action: "user.created",
      entityType: "USER",
      entityId: u.id,
      metadata: { email: u.email, role: "AGENCY_ADMIN" },
      createdAt: u.createdAt!,
    });
  }

  // Subscription created for active/trial agencies
  for (let i = 0; i < createdAgencies.length; i++) {
    const agency = createdAgencies[i]!;
    const ad = AGENCY_DATA[i]!;
    if (ad.billingStatus === "active" || ad.billingStatus === "trial") {
      logEntries.push({
        userId: admin.id,
        action: "subscription.created",
        entityType: "AGENCY",
        entityId: agency.id,
        agencyId: agency.id,
        metadata: { plan: ad.planSlug, status: ad.billingStatus },
        createdAt: agency.createdAt,
      });
    }
  }

  // Ticket created
  for (const ticket of createdTickets) {
    const agencyIdx = createdAgencies.findIndex((a) => a.id === ticket.agencyId);
    logEntries.push({
      userId: agencyIdx >= 0 ? agencyAdmins[agencyIdx]!.id : admin.id,
      action: "ticket.created",
      entityType: "TICKET",
      entityId: ticket.id,
      agencyId: ticket.agencyId,
      metadata: { subject: ticket.subject, priority: ticket.priority },
      createdAt: ticket.createdAt,
    });
  }

  // Ticket status changed (for non-open tickets)
  for (const ticket of createdTickets.filter((t) => t.status !== "OPEN")) {
    logEntries.push({
      userId: admin.id,
      action: "ticket.status_changed",
      entityType: "TICKET",
      entityId: ticket.id,
      agencyId: ticket.agencyId,
      metadata: { from: "OPEN", to: ticket.status },
      createdAt: randomPastDate(15, 1),
    });
  }

  // Auth logins scattered across 30 days
  const allAdminUsers = [admin, ...agencyAdmins];
  for (let i = 0; i < 25; i++) {
    const u = pick(allAdminUsers);
    logEntries.push({
      userId: u.id,
      action: "auth.login",
      entityType: "USER",
      entityId: u.id,
      metadata: { email: u.email },
      ipAddress: `187.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
      createdAt: randomPastDate(30),
    });
  }

  // Plan updated
  logEntries.push({
    userId: admin.id,
    action: "plan.updated",
    entityType: "PLAN",
    entityId: planMap["pro"]!.id,
    metadata: { fields: ["priceMonthly", "features"] },
    createdAt: randomPastDate(12, 3),
  });

  // Settings updated
  logEntries.push({
    userId: admin.id,
    action: "settings.updated",
    metadata: { section: "general", fields: ["platformName", "primaryColor"] },
    createdAt: randomPastDate(8, 1),
  });

  // Agency suspended (Old Marketing)
  const suspendedAgency = createdAgencies.find((a) => a.slug === "old-marketing");
  if (suspendedAgency) {
    logEntries.push({
      userId: admin.id,
      action: "agency.suspended",
      entityType: "AGENCY",
      entityId: suspendedAgency.id,
      metadata: { reason: "Pagamento em atraso" },
      createdAt: randomPastDate(10, 3),
    });
  }

  // Impersonation log
  logEntries.push({
    userId: admin.id,
    action: "auth.impersonation_start",
    entityType: "USER",
    entityId: agencyAdmins[0]!.id,
    metadata: { targetEmail: agencyAdmins[0]!.email },
    createdAt: randomPastDate(5, 1),
  });

  await db.insert(auditLogs).values(logEntries);

  // ── Platform Settings ───────────────────────────────────────────────────────
  console.log("⚙️  Criando configurações da plataforma...");
  for (const setting of DEFAULT_SETTINGS) {
    await db
      .insert(platformSettings)
      .values({ key: setting.key, value: setting.value, updatedBy: admin.id })
      .onConflictDoUpdate({
        target: platformSettings.key,
        set: { value: setting.value, updatedAt: new Date() },
      });
  }

  // ── QA Demo: Agência Demo ────────────────────────────────────────────────────
  console.log("🚀 Criando dados de QA (Agência Demo)...");

  const demoPlan = planMap["growth"]!;

  const [agenciaDemo] = await db
    .insert(agencies)
    .values({
      name: "Agência Demo",
      slug: "agencia-demo",
      planId: demoPlan.id,
      agencyStatus: "active",
      active: true,
      billingStatus: "active",
      maxMembers: demoPlan.maxUsers,
      maxClients: demoPlan.maxClients,
    })
    .returning();

  // AGENCY_ADMIN da Agência Demo
  const agencyDemoPw = await hash("Agency@123456", 12);
  const [agencyAdminDemo] = await db
    .insert(users)
    .values({
      name: "Admin Demo",
      email: "agency@demo.com",
      passwordHash: agencyDemoPw,
      role: "AGENCY_ADMIN",
      userStatus: "active",
      emailVerified: new Date(),
    })
    .returning();

  await db.insert(agencyUsers).values({
    agencyId: agenciaDemo!.id,
    userId: agencyAdminDemo!.id,
    role: "AGENCY_ADMIN",
  });

  // Contexto do AGENCY_ADMIN (scope=agency)
  await db
    .insert(userContexts)
    .values({
      userId: agencyAdminDemo!.id,
      activeScope: "agency",
      activeAgencyId: agenciaDemo!.id,
    })
    .onConflictDoUpdate({
      target: userContexts.userId,
      set: {
        activeScope: "agency",
        activeAgencyId: agenciaDemo!.id,
        updatedAt: new Date(),
      },
    });

  // Usuário CLIENT para o portal
  const clientPw = await hash("Client@123456", 12);
  const [portalUser] = await db
    .insert(users)
    .values({
      name: "Cliente Demo",
      email: "portal@demo.com",
      passwordHash: clientPw,
      role: "CLIENT",
      userStatus: "active",
      emailVerified: new Date(),
    })
    .returning();

  // Cliente no CRM da Agência Demo (vinculado ao usuário de portal)
  const [clienteDemo] = await db
    .insert(clients)
    .values({
      agencyId: agenciaDemo!.id,
      name: "Cliente Demo LTDA",
      email: "cliente@demo.com",
      company: "Cliente Demo LTDA",
      status: "active",
      phone: "(11) 99999-0000",
      userId: portalUser!.id,
    })
    .returning();

  // Contexto do CLIENT (scope=client)
  await db
    .insert(userContexts)
    .values({
      userId: portalUser!.id,
      activeScope: "client",
      activeClientId: clienteDemo!.id,
    })
    .onConflictDoUpdate({
      target: userContexts.userId,
      set: {
        activeScope: "client",
        activeClientId: clienteDemo!.id,
        updatedAt: new Date(),
      },
    });

  // 1 deal no pipeline
  await db.insert(deals).values({
    agencyId: agenciaDemo!.id,
    clientId: clienteDemo!.id,
    title: "Projeto de Marketing Digital",
    value: "5000.00",
    stageId: "PROPOSAL",
    description: "Proposta de gerenciamento de redes sociais e campanhas pagas.",
    dealProbabilityDynamic: 60,
    expectedCloseDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    responsibleId: agencyAdminDemo!.id,
  });

  // 1 ticket de suporte
  const [demoTicket] = await db
    .insert(tickets)
    .values({
      agencyId: agenciaDemo!.id,
      clientId: clienteDemo!.id,
      subject: "Dúvida sobre relatório mensal de campanhas",
      status: "OPEN",
      priority: "MEDIUM",
      type: "SUPPORT",
      createdBy: agencyAdminDemo!.id,
    })
    .returning();

  await db.insert(ticketMessages).values({
    ticketId: demoTicket!.id,
    userId: agencyAdminDemo!.id,
    content:
      "Olá! Gostaria de entender melhor como interpretar os dados do relatório mensal de campanhas. Qual métrica devo usar para avaliar o ROI?",
    isInternal: false,
  });

  // 1 atividade/nota
  await db.insert(activities).values({
    agencyId: agenciaDemo!.id,
    entityType: "CLIENT",
    entityId: clienteDemo!.id,
    userId: agencyAdminDemo!.id,
    type: "NOTE",
    description:
      "Reunião de alinhamento realizada. Cliente interessado em expandir campanhas para o Google Ads no próximo trimestre.",
  });

  // Integração Google Ads (desconectada) para Agência Demo
  await db
    .insert(integrations)
    .values({
      agencyId: agenciaDemo!.id,
      provider: "GOOGLE_ADS",
      status: "disconnected",
      label: "Google Ads",
    })
    .onConflictDoNothing();

  // ── Summary ─────────────────────────────────────────────────────────────────
  console.log(`
✅ Seed completo!

📊 Dados criados:
   • ${PLAN_DATA.length} planos (Starter, Growth, Pro, Enterprise)
   • 1 Super Admin
   • ${AGENCY_DATA.length} agências + 1 Agência Demo (QA)
   • ${AGENCY_DATA.reduce((s, a) => s + 1 + a.memberNames.length, 0)} usuários de agência + 2 QA (agency@demo.com, portal@demo.com)
   • ${Object.values(clientsByAgency).reduce((s, arr) => s + arr.length, 0)} clientes + 1 Cliente Demo LTDA
   • ${createdTickets.length} tickets com mensagens + 1 ticket QA
   • ${logEntries.length} audit logs
   • ${DEFAULT_SETTINGS.length} configurações

🔑 Credenciais de acesso:
   Super Admin   → admin@360growth.com       / Admin@123456
   Acme Digital  → admin@acme-digital.com    / Agency@123456
   WebPro        → admin@webpro.com          / Agency@123456
   StartUp Lab   → admin@startup-lab.com     / Agency@123456
   Creative      → admin@creative-house.com  / Agency@123456

🧪 QA Demo:
   Agência Admin → agency@demo.com           / Agency@123456
   Portal Client → portal@demo.com           / Client@123456
  `);
}

seed().catch(console.error).finally(() => process.exit());
