/**
 * seed-demo-test.ts
 *
 * Cria dados ficticios completos para testes manuais.
 * NÃO apaga dados existentes — usa ON CONFLICT DO NOTHING.
 *
 * Execução:
 *   npx tsx src/lib/db/seed-demo-test.ts
 *
 * Credenciais criadas:
 *   Agência Admin  → agencia@teste.com      / Teste@123456
 *   Membro         → membro@teste.com       / Teste@123456
 *   Portal Cliente1 → carlos@techvision.com / Teste@123456
 *   Portal Cliente2 → paula@boutique.com    / Teste@123456
 */

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
  pipelines,
  pipelineStages,
  tickets,
  ticketMessages,
  activities,
  userContexts,
} from "./schema";
import { eq, and } from "drizzle-orm";
import { hash } from "bcryptjs";

// ─── helpers ─────────────────────────────────────────────────────────────────

function daysAgo(n: number): Date {
  return new Date(Date.now() - n * 24 * 60 * 60 * 1000);
}

function daysFromNow(n: number): Date {
  return new Date(Date.now() + n * 24 * 60 * 60 * 1000);
}

// ─── seed ────────────────────────────────────────────────────────────────────

async function seedDemoTest() {
  console.log("🌱 Iniciando seed de dados de teste...\n");

  // ── Plano ────────────────────────────────────────────────────────────────
  const pw = await hash("Teste@123456", 12);

  // Busca ou cria plano Pro
  let plan = await db.query.plans.findFirst({ where: eq(plans.slug, "pro") });
  if (!plan) {
    [plan] = await db
      .insert(plans)
      .values({
        name: "Pro",
        slug: "pro",
        description: "Plano Pro para testes",
        priceMonthly: "397.00",
        priceYearly: "3970.00",
        maxUsers: 25,
        maxClients: 500,
        sortOrder: 3,
        features: ["Tudo incluído"],
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
        },
        isActive: true,
      })
      .returning();
    console.log("  ✓ Plano Pro criado");
  } else {
    console.log("  ✓ Plano Pro já existe");
  }

  // ── Agência ──────────────────────────────────────────────────────────────
  let agency = await db.query.agencies.findFirst({
    where: eq(agencies.slug, "agencia-teste"),
  });

  if (!agency) {
    [agency] = await db
      .insert(agencies)
      .values({
        name: "Agência Teste 360",
        slug: "agencia-teste",
        planId: plan!.id,
        agencyStatus: "active",
        active: true,
        billingStatus: "active",
        maxMembers: 25,
        maxClients: 500,
        createdAt: daysAgo(30),
        updatedAt: daysAgo(30),
      })
      .returning();
    console.log("  ✓ Agência 'Agência Teste 360' criada");
  } else {
    console.log("  ✓ Agência já existe, reutilizando");
  }

  const agencyId = agency!.id;

  // ── Usuários da agência ───────────────────────────────────────────────────
  // Admin
  let adminUser = await db.query.users.findFirst({
    where: eq(users.email, "agencia@teste.com"),
  });
  if (!adminUser) {
    [adminUser] = await db
      .insert(users)
      .values({
        name: "Diego Oliveira",
        email: "agencia@teste.com",
        passwordHash: pw,
        role: "AGENCY_ADMIN",
        userStatus: "active",
        emailVerified: new Date(),
        createdAt: daysAgo(30),
      })
      .returning();
    await db.insert(agencyUsers).values({
      agencyId,
      userId: adminUser!.id,
      role: "AGENCY_ADMIN",
    });
    await db.insert(userContexts).values({
      userId: adminUser!.id,
      activeScope: "agency",
      activeAgencyId: agencyId,
    });
    console.log("  ✓ Admin criado: agencia@teste.com");
  } else {
    console.log("  ✓ Admin já existe: agencia@teste.com");
  }

  // Membro
  let memberUser = await db.query.users.findFirst({
    where: eq(users.email, "membro@teste.com"),
  });
  if (!memberUser) {
    [memberUser] = await db
      .insert(users)
      .values({
        name: "Fernanda Costa",
        email: "membro@teste.com",
        passwordHash: pw,
        role: "AGENCY_MEMBER",
        userStatus: "active",
        emailVerified: new Date(),
        createdAt: daysAgo(25),
      })
      .returning();
    await db.insert(agencyUsers).values({
      agencyId,
      userId: memberUser!.id,
      role: "AGENCY_MEMBER",
    });
    await db.insert(userContexts).values({
      userId: memberUser!.id,
      activeScope: "agency",
      activeAgencyId: agencyId,
    });
    console.log("  ✓ Membro criado: membro@teste.com");
  } else {
    console.log("  ✓ Membro já existe: membro@teste.com");
  }

  // ── Cliente 1 — TechVision Soluções ──────────────────────────────────────
  let portalUser1 = await db.query.users.findFirst({
    where: eq(users.email, "carlos@techvision.com"),
  });
  if (!portalUser1) {
    [portalUser1] = await db
      .insert(users)
      .values({
        name: "Carlos Almeida",
        email: "carlos@techvision.com",
        passwordHash: pw,
        role: "CLIENT",
        userStatus: "active",
        emailVerified: new Date(),
      })
      .returning();
  }

  let client1 = await db.query.clients.findFirst({
    where: and(eq(clients.agencyId, agencyId), eq(clients.email, "carlos@techvision.com")),
  });
  if (!client1) {
    [client1] = await db
      .insert(clients)
      .values({
        agencyId,
        name: "Carlos Almeida",
        email: "carlos@techvision.com",
        company: "TechVision Soluções LTDA",
        phone: "(11) 98765-4321",
        status: "active",
        userId: portalUser1!.id,
        createdAt: daysAgo(28),
        updatedAt: daysAgo(28),
      })
      .returning();
    await db
      .insert(userContexts)
      .values({
        userId: portalUser1!.id,
        activeScope: "client",
        activeClientId: client1!.id,
      })
      .onConflictDoUpdate({
        target: userContexts.userId,
        set: { activeScope: "client", activeClientId: client1!.id, updatedAt: new Date() },
      });
    console.log("  ✓ Cliente 1 criado: TechVision Soluções (carlos@techvision.com)");
  } else {
    console.log("  ✓ Cliente 1 já existe: TechVision");
  }

  // ── Cliente 2 — Boutique Moda & Style ────────────────────────────────────
  let portalUser2 = await db.query.users.findFirst({
    where: eq(users.email, "paula@boutique.com"),
  });
  if (!portalUser2) {
    [portalUser2] = await db
      .insert(users)
      .values({
        name: "Paula Mendes",
        email: "paula@boutique.com",
        passwordHash: pw,
        role: "CLIENT",
        userStatus: "active",
        emailVerified: new Date(),
      })
      .returning();
  }

  let client2 = await db.query.clients.findFirst({
    where: and(eq(clients.agencyId, agencyId), eq(clients.email, "paula@boutique.com")),
  });
  if (!client2) {
    [client2] = await db
      .insert(clients)
      .values({
        agencyId,
        name: "Paula Mendes",
        email: "paula@boutique.com",
        company: "Boutique Moda & Style",
        phone: "(21) 99812-3344",
        status: "active",
        userId: portalUser2!.id,
        createdAt: daysAgo(20),
        updatedAt: daysAgo(20),
      })
      .returning();
    await db
      .insert(userContexts)
      .values({
        userId: portalUser2!.id,
        activeScope: "client",
        activeClientId: client2!.id,
      })
      .onConflictDoUpdate({
        target: userContexts.userId,
        set: { activeScope: "client", activeClientId: client2!.id, updatedAt: new Date() },
      });
    console.log("  ✓ Cliente 2 criado: Boutique Moda & Style (paula@boutique.com)");
  } else {
    console.log("  ✓ Cliente 2 já existe: Boutique");
  }

  // ── Contatos dos clientes ────────────────────────────────────────────────
  const existingContacts = await db.query.contacts.findMany({
    where: eq(contacts.agencyId, agencyId),
  });

  if (existingContacts.length === 0) {
    await db.insert(contacts).values([
      {
        agencyId,
        clientId: client1!.id,
        name: "Roberto Tavares",
        email: "roberto@techvision.com",
        phone: "(11) 3456-7890",
        position: "CTO",
        notes: "Principal ponto de contato técnico.",
      },
      {
        agencyId,
        clientId: client1!.id,
        name: "Mariana Freitas",
        email: "mariana@techvision.com",
        phone: "(11) 3456-7891",
        position: "Gerente de Marketing",
        notes: "Responsável pelo orçamento de mídia.",
      },
      {
        agencyId,
        clientId: client2!.id,
        name: "Lucas Pinheiro",
        email: "lucas@boutique.com",
        phone: "(21) 3321-5566",
        position: "Sócio-fundador",
        notes: "Toma todas as decisões de marketing.",
      },
    ]);
    console.log("  ✓ 3 contatos criados");
  }

  // ── Pipeline para TechVision ─────────────────────────────────────────────
  let pipeline1 = await db.query.pipelines.findFirst({
    where: and(eq(pipelines.agencyId, agencyId), eq(pipelines.clientId, client1!.id)),
  });

  if (!pipeline1) {
    [pipeline1] = await db
      .insert(pipelines)
      .values({
        agencyId,
        clientId: client1!.id,
        name: "Pipeline TechVision",
        createdBy: adminUser!.id,
      })
      .returning();
  }

  // Pipeline para Boutique
  let pipeline2 = await db.query.pipelines.findFirst({
    where: and(eq(pipelines.agencyId, agencyId), eq(pipelines.clientId, client2!.id)),
  });
  if (!pipeline2) {
    [pipeline2] = await db
      .insert(pipelines)
      .values({
        agencyId,
        clientId: client2!.id,
        name: "Pipeline Boutique",
        createdBy: adminUser!.id,
      })
      .returning();
  }

  // ── Stages para os pipelines ─────────────────────────────────────────────
  const existingStages1 = await db.query.pipelineStages.findMany({
    where: eq(pipelineStages.pipelineId, pipeline1!.id),
  });

  let stages1 = existingStages1;
  if (existingStages1.length === 0) {
    stages1 = await db
      .insert(pipelineStages)
      .values([
        { pipelineId: pipeline1!.id, name: "Lead", color: "#94a3b8", orderIndex: 0 },
        { pipelineId: pipeline1!.id, name: "Qualificado", color: "#3b82f6", orderIndex: 1 },
        { pipelineId: pipeline1!.id, name: "Proposta", color: "#f59e0b", orderIndex: 2 },
        { pipelineId: pipeline1!.id, name: "Negociação", color: "#8b5cf6", orderIndex: 3 },
        { pipelineId: pipeline1!.id, name: "Ganho", color: "#10b981", orderIndex: 4, isClosedWon: true },
        { pipelineId: pipeline1!.id, name: "Perdido", color: "#ef4444", orderIndex: 5, isClosedLost: true },
      ])
      .returning();
    console.log("  ✓ Stages do pipeline TechVision criadas");
  }

  const existingStages2 = await db.query.pipelineStages.findMany({
    where: eq(pipelineStages.pipelineId, pipeline2!.id),
  });

  let stages2 = existingStages2;
  if (existingStages2.length === 0) {
    stages2 = await db
      .insert(pipelineStages)
      .values([
        { pipelineId: pipeline2!.id, name: "Prospecto", color: "#94a3b8", orderIndex: 0 },
        { pipelineId: pipeline2!.id, name: "Apresentação", color: "#3b82f6", orderIndex: 1 },
        { pipelineId: pipeline2!.id, name: "Proposta", color: "#f59e0b", orderIndex: 2 },
        { pipelineId: pipeline2!.id, name: "Fechado", color: "#10b981", orderIndex: 3, isClosedWon: true },
        { pipelineId: pipeline2!.id, name: "Cancelado", color: "#ef4444", orderIndex: 4, isClosedLost: true },
      ])
      .returning();
    console.log("  ✓ Stages do pipeline Boutique criadas");
  }

  // ── Deals — TechVision ───────────────────────────────────────────────────
  const existingDeals = await db.query.deals.findMany({
    where: eq(deals.agencyId, agencyId),
  });

  if (existingDeals.length === 0) {
    const s1 = stages1.reduce((m, s) => { m[s.name] = s.id; return m; }, {} as Record<string, string>);
    const s2 = stages2.reduce((m, s) => { m[s.name] = s.id; return m; }, {} as Record<string, string>);

    await db.insert(deals).values([
      // TechVision
      {
        agencyId,
        clientId: client1!.id,
        pipelineId: pipeline1!.id,
        stageId: s1["Proposta"],
        title: "Gestão de Google Ads — 3 meses",
        description: "Campanha de performance focada em conversão para e-commerce B2B.",
        value: "9000.00",
        status: "OPEN",
        dealProbabilityDynamic: 65,
        responsibleId: adminUser!.id,
        expectedCloseDate: daysFromNow(15),
        createdAt: daysAgo(20),
        updatedAt: daysAgo(5),
      },
      {
        agencyId,
        clientId: client1!.id,
        pipelineId: pipeline1!.id,
        stageId: s1["Negociação"],
        title: "Redesign Site Institucional",
        description: "Novo site com foco em conversão e SEO técnico.",
        value: "15000.00",
        status: "OPEN",
        dealProbabilityDynamic: 75,
        responsibleId: memberUser!.id,
        expectedCloseDate: daysFromNow(7),
        createdAt: daysAgo(18),
        updatedAt: daysAgo(2),
      },
      {
        agencyId,
        clientId: client1!.id,
        pipelineId: pipeline1!.id,
        stageId: s1["Ganho"],
        title: "Social Media — Janeiro/Fevereiro",
        description: "Gerenciamento de redes sociais e criação de conteúdo.",
        value: "4800.00",
        status: "WON",
        dealProbabilityDynamic: 100,
        responsibleId: adminUser!.id,
        expectedCloseDate: daysAgo(10),
        createdAt: daysAgo(45),
        updatedAt: daysAgo(10),
      },
      {
        agencyId,
        clientId: client1!.id,
        pipelineId: pipeline1!.id,
        stageId: s1["Perdido"],
        title: "Consultoria de Branding",
        description: "Redesign completo da identidade visual.",
        value: "25000.00",
        status: "LOST",
        dealProbabilityDynamic: 0,
        responsibleId: memberUser!.id,
        expectedCloseDate: daysAgo(5),
        createdAt: daysAgo(30),
        updatedAt: daysAgo(5),
      },
      // Boutique
      {
        agencyId,
        clientId: client2!.id,
        pipelineId: pipeline2!.id,
        stageId: s2["Apresentação"],
        title: "Campanhas Meta Ads — Q1 2026",
        description: "Facebook e Instagram Ads para lançamento de coleção.",
        value: "7500.00",
        status: "OPEN",
        dealProbabilityDynamic: 50,
        responsibleId: memberUser!.id,
        expectedCloseDate: daysFromNow(20),
        createdAt: daysAgo(12),
        updatedAt: daysAgo(3),
      },
      {
        agencyId,
        clientId: client2!.id,
        pipelineId: pipeline2!.id,
        stageId: s2["Proposta"],
        title: "Produção de Conteúdo — Pacote Mensal",
        description: "Fotos, reels e stories para todas as plataformas.",
        value: "3200.00",
        status: "OPEN",
        dealProbabilityDynamic: 70,
        responsibleId: adminUser!.id,
        expectedCloseDate: daysFromNow(10),
        createdAt: daysAgo(8),
        updatedAt: daysAgo(1),
      },
      {
        agencyId,
        clientId: client2!.id,
        pipelineId: pipeline2!.id,
        stageId: s2["Fechado"],
        title: "Email Marketing — Black Friday",
        description: "Criação e envio de 3 campanhas de email.",
        value: "2100.00",
        status: "WON",
        dealProbabilityDynamic: 100,
        responsibleId: adminUser!.id,
        expectedCloseDate: daysAgo(20),
        createdAt: daysAgo(60),
        updatedAt: daysAgo(20),
      },
    ]);
    console.log("  ✓ 7 deals criados (4 TechVision + 3 Boutique)");
  } else {
    console.log(`  ✓ ${existingDeals.length} deals já existem, pulando`);
  }

  // ── Tickets — TechVision ─────────────────────────────────────────────────
  const existingTickets = await db.query.tickets.findMany({
    where: eq(tickets.agencyId, agencyId),
  });

  if (existingTickets.length === 0) {
    const ticketData = [
      // TechVision
      {
        agencyId, clientId: client1!.id,
        subject: "Relatório de Google Ads não carrega",
        status: "OPEN" as const, priority: "HIGH" as const, type: "BUG" as const,
        createdBy: adminUser!.id, assignedTo: memberUser!.id,
        createdAt: daysAgo(5),
        messages: [
          { userId: adminUser!.id, content: "Desde ontem o relatório de Google Ads fica em branco. Já tentei em Chrome e Safari.", isInternal: false },
          { userId: adminUser!.id, content: "Log de erro: TypeError: Cannot read properties of undefined (reading 'metrics')", isInternal: true },
          { userId: memberUser!.id, content: "Estamos investigando! Provavelmente é uma mudança na API do Google Ads. Retorno até amanhã.", isInternal: false },
        ],
      },
      {
        agencyId, clientId: client1!.id,
        subject: "Dúvida sobre métricas de conversão",
        status: "IN_PROGRESS" as const, priority: "MEDIUM" as const, type: "SUPPORT" as const,
        createdBy: adminUser!.id, assignedTo: adminUser!.id,
        createdAt: daysAgo(10),
        messages: [
          { userId: adminUser!.id, content: "Qual a diferença entre 'Conversões' e 'Todas as conversões' no Google Ads? Nosso cliente está confuso.", isInternal: false },
          { userId: adminUser!.id, content: "'Conversões' conta apenas ações que você marcou como primárias. 'Todas as conversões' inclui secundárias também.", isInternal: false },
          { userId: adminUser!.id, content: "Faz sentido! Vou explicar para o cliente. Mas qual usar para otimizar campanhas de performance?", isInternal: false },
        ],
      },
      {
        agencyId, clientId: client1!.id,
        subject: "Solicitação de acesso ao portal para novo contato",
        status: "RESOLVED" as const, priority: "LOW" as const, type: "SUPPORT" as const,
        createdBy: adminUser!.id, assignedTo: null,
        createdAt: daysAgo(15),
        resolvedAt: daysAgo(14),
        messages: [
          { userId: adminUser!.id, content: "Precisamos criar acesso ao portal para nosso novo responsável de marketing, Roberto Tavares (roberto@techvision.com).", isInternal: false },
          { userId: adminUser!.id, content: "Acesso criado! Roberto receberá o convite por email.", isInternal: false },
        ],
      },
      // Boutique
      {
        agencyId, clientId: client2!.id,
        subject: "Aprovação de artes para campanha de verão atrasada",
        status: "OPEN" as const, priority: "URGENT" as const, type: "SUPPORT" as const,
        createdBy: adminUser!.id, assignedTo: memberUser!.id,
        createdAt: daysAgo(2),
        messages: [
          { userId: adminUser!.id, content: "A campanha de verão precisa entrar no ar em 3 dias e ainda não recebemos aprovação das artes enviadas há uma semana.", isInternal: false },
          { userId: adminUser!.id, content: "Já enviei 2 emails sem resposta. Tentar ligar para a Paula?", isInternal: true },
          { userId: memberUser!.id, content: "Olá Paula! Preciso urgentemente da sua aprovação para as artes da campanha de verão. As peças foram enviadas por email no dia 5.", isInternal: false },
        ],
      },
      {
        agencyId, clientId: client2!.id,
        subject: "Erro no pixel do Facebook — conversões não registrando",
        status: "IN_PROGRESS" as const, priority: "HIGH" as const, type: "BUG" as const,
        createdBy: adminUser!.id, assignedTo: adminUser!.id,
        createdAt: daysAgo(7),
        messages: [
          { userId: adminUser!.id, content: "O Pixel do Facebook parou de registrar eventos de compra no site da Boutique. Confirmado via Facebook Pixel Helper.", isInternal: false },
          { userId: memberUser!.id, content: "Atualizaram o tema do WooCommerce recentemente? Pode ter sobrescrito o código do pixel.", isInternal: false },
          { userId: adminUser!.id, content: "Confirmado: atualizaram o tema. Vou reinstalar o pixel via GTM para evitar esse problema futuramente.", isInternal: false },
        ],
      },
      {
        agencyId, clientId: client2!.id,
        subject: "Solicitação de relatório de performance — Fevereiro",
        status: "CLOSED" as const, priority: "LOW" as const, type: "SUPPORT" as const,
        createdBy: adminUser!.id, assignedTo: null,
        createdAt: daysAgo(25),
        resolvedAt: daysAgo(23),
        messages: [
          { userId: adminUser!.id, content: "Podem gerar o relatório de performance de fevereiro para apresentarmos na reunião de diretoria?", isInternal: false },
          { userId: adminUser!.id, content: "Relatório enviado para paula@boutique.com! Resumo: ROAS de 4.2, CPL de R$18, 340 leads gerados.", isInternal: false },
          { userId: adminUser!.id, content: "Perfeito! Exatamente o que precisávamos. Obrigada!", isInternal: false },
        ],
      },
    ];

    for (const td of ticketData) {
      const { messages, resolvedAt, ...ticketFields } = td;
      const [ticket] = await db
        .insert(tickets)
        .values({
          ...ticketFields,
          resolvedAt: resolvedAt ?? null,
          updatedAt: ticketFields.createdAt,
        })
        .returning();

      for (let i = 0; i < messages.length; i++) {
        await db.insert(ticketMessages).values({
          ticketId: ticket!.id,
          ...messages[i]!,
          createdAt: new Date(ticketFields.createdAt.getTime() + (i + 1) * 3 * 60 * 60 * 1000),
        });
      }
    }

    console.log(`  ✓ ${ticketData.length} tickets criados (3 TechVision + 3 Boutique)`);
  } else {
    console.log(`  ✓ ${existingTickets.length} tickets já existem, pulando`);
  }

  // ── Atividades / notas ───────────────────────────────────────────────────
  const existingActivities = await db.query.activities.findMany({
    where: eq(activities.agencyId, agencyId),
  });

  if (existingActivities.length === 0) {
    await db.insert(activities).values([
      {
        agencyId,
        entityType: "CLIENT",
        entityId: client1!.id,
        userId: adminUser!.id,
        type: "NOTE",
        description: "Reunião de kick-off realizada. Cliente muito engajado, meta principal é aumentar leads B2B em 30% até junho.",
        createdAt: daysAgo(27),
      },
      {
        agencyId,
        entityType: "CLIENT",
        entityId: client1!.id,
        userId: memberUser!.id,
        type: "NOTE",
        description: "Ligação de follow-up: aprovaram o planejamento de mídia para Q1. Budget de R$15k/mês em Google Ads.",
        createdAt: daysAgo(18),
      },
      {
        agencyId,
        entityType: "CLIENT",
        entityId: client1!.id,
        userId: adminUser!.id,
        type: "NOTE",
        description: "Cliente solicitou relatório semanal toda segunda-feira até as 10h.",
        createdAt: daysAgo(10),
      },
      {
        agencyId,
        entityType: "CLIENT",
        entityId: client2!.id,
        userId: adminUser!.id,
        type: "NOTE",
        description: "Onboarding concluído. Foco em Instagram e TikTok para o lançamento da coleção verão 2026.",
        createdAt: daysAgo(19),
      },
      {
        agencyId,
        entityType: "CLIENT",
        entityId: client2!.id,
        userId: memberUser!.id,
        type: "NOTE",
        description: "Paula confirmou orçamento de R$8k para Meta Ads em março. Briefing recebido.",
        createdAt: daysAgo(8),
      },
    ]);
    console.log("  ✓ 5 notas/atividades criadas");
  }

  // ── Sumário ──────────────────────────────────────────────────────────────
  console.log(`
╔══════════════════════════════════════════════════════════════╗
║              ✅  SEED DE TESTES CONCLUÍDO                    ║
╠══════════════════════════════════════════════════════════════╣
║                                                              ║
║  🏢 AGÊNCIA                                                  ║
║     Agência Teste 360                                        ║
║                                                              ║
║  👤 USUÁRIOS DA AGÊNCIA                                      ║
║     Admin   → agencia@teste.com    / Teste@123456            ║
║     Membro  → membro@teste.com     / Teste@123456            ║
║                                                              ║
║  👥 CLIENTES (Portal)                                        ║
║     Carlos  → carlos@techvision.com / Teste@123456           ║
║              TechVision Soluções LTDA                        ║
║     Paula   → paula@boutique.com   / Teste@123456            ║
║              Boutique Moda & Style                           ║
║                                                              ║
║  📊 DADOS CRIADOS                                            ║
║     • 2 pipelines com stages completos                       ║
║     • 7 deals em diferentes estágios                         ║
║     • 6 tickets (open, in_progress, resolved, closed)        ║
║     • 3 contatos vinculados                                  ║
║     • 5 notas/atividades                                     ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝
  `);
}

seedDemoTest().catch(console.error).finally(() => process.exit());
