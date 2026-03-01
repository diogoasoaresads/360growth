/** Incremental build identifier — bump on every release. */
export const BUILD_ID = "0019";

/** Timestamp of the last release (YYYY-MM-DD HH:mm). */
export const UPDATED_AT = "2026-03-01 04:00";

/** Timezone used for UPDATED_AT. */
export const UPDATED_TZ = "America/Sao_Paulo";

export interface ChangelogEntry {
  id: string;
  at: string;
  lines: string[];
}

/**
 * Release changelog — newest entry first.
 * Each entry has 2–3 lines of plain text.
 * Maintain at minimum the last 10 entries.
 */
export const CHANGELOG: ChangelogEntry[] = [
  {
    id: "0019",
    at: "2026-03-01 04:00",
    lines: [
      "Integration Framework v1: conectar, trocar chave e desconectar integrações direto no sistema (sem env por cliente)",
      "Tela de integrações por agência (Asaas ativo + Google Ads/Meta Ads/GA4 em breve) com criptografia AES-256-GCM",
      "Seed QA com Agência Demo + Cliente Demo LTDA + usuários prontos para teste (agency@demo.com / portal@demo.com)",
    ],
  },
  {
    id: "0018",
    at: "2026-03-01 00:30",
    lines: [
      "Fix admin/agencies query after Asaas migration (removed Stripe fields)",
      "Schema: stripeCustomerId/stripeSubscriptionId/subscriptionStatus → asaasCustomerId/asaasSubscriptionId/billingStatus + currentPeriodEnd",
      "Billing, dashboard e webhook atualizados para usar billingStatus; seed corrigido",
    ],
  },
  {
    id: "0017",
    at: "2026-02-28 23:30",
    lines: [
      "Pacote QA: troca de contexto do PO sem relogin — middleware refatorado, cookie de escopo removido do guard",
      "CRM: página de detalhe do cliente com seção 'Acesso ao Portal' (criar, resetar senha, revogar)",
      "Impersonation suporta CLIENT: verifica vínculo, atualiza user_contexts e redireciona para /portal",
    ],
  },
  {
    id: "0016",
    at: "2026-02-28 19:00",
    lines: [
      "P2-7 — Contexto unificado: user_contexts é a única fonte de verdade para todos os roles",
      "Bootstrap automático no login: AGENCY_* persistem scope=agency e CLIENT persistem scope=client",
      "Hotfix build: import não-usado isNotNull removido de templates.ts; portal corrige lookup de agencyId",
    ],
  },
  {
    id: "0015",
    at: "2026-02-28 17:30",
    lines: [
      "Painel System Health: checks de DB (latência), migrations, Resend, Stripe e erros recentes",
      "Cards com status visual (verde/vermelho/cinza) e dados em tempo real da plataforma",
      "Acesso restrito a SUPER_ADMIN; link Health adicionado ao sidebar do admin",
    ],
  },
  {
    id: "0014",
    at: "2026-02-28 16:30",
    lines: [
      "Página de logs operacionais por agência: timeline filtrada por ação, período e busca",
      "Paginação (50 por página), modal com JSON do payload e índice composto em audit_logs",
      "Tab Logs adicionada ao painel de agência; acesso restrito a SUPER_ADMIN",
    ],
  },
  {
    id: "0013",
    at: "2026-02-28 15:00",
    lines: [
      "Templates de mensagem editáveis: plataforma + overrides por agência com preview Markdown",
      "sendSystemEmail integrado: welcome_user no registro e limit_blocked ao atingir limite",
      "CRUD de templates com audit log template_changed; página /admin/templates no painel",
    ],
  },
  {
    id: "0012",
    at: "2026-02-28 13:30",
    lines: [
      "Feature Flags por agência: overrides editáveis pelo PO com audit log (feature_flag.override_set)",
      "UI de flags no admin da agência: global/override/efetivo + toggle e botão de remoção",
      "Bloqueio real por flags tickets_enabled/deals_enabled + botão/modal de atualizações no login",
    ],
  },
  {
    id: "0011",
    at: "2026-02-28 11:00",
    lines: [
      "Painel de controle de agência (PO): botão 'Entrar no modo agência', status, plano e feature flags",
      "Bloquear/desbloquear agência com audit log agency_status_changed (before/after)",
      "Enforcement de agency blocked: AGENCY_* e CLIENT redirecionados; SUPER_ADMIN sempre permitido",
    ],
  },
  {
    id: "0010",
    at: "2026-02-28 09:15",
    lines: [
      "Módulo agency-usage.ts: validatePlanLimit (throw pt-BR) + audit log limit_blocked com payload completo",
      "build-info.ts com BUILD_ID, UPDATED_AT e CHANGELOG histórico estático",
      "Bloco 'Build / Atualizações' com histórico visível na tela de login",
    ],
  },
  {
    id: "0009",
    at: "2026-02-27 17:00",
    lines: [
      "Pipeline Docker corrigido: migrações Drizzle aplicadas no startup do container (runtime)",
      "Dockerfile atualizado; .dockerignore corrigido para incluir drizzle/migrations",
    ],
  },
  {
    id: "0008",
    at: "2026-02-27 15:30",
    lines: [
      "Layout /agency corrigido: SUPER_ADMIN com contexto ativo pode acessar rotas de agência",
      "Redirecionamento para /admin quando SUPER_ADMIN acessa sem contexto de agência selecionado",
    ],
  },
  {
    id: "0007",
    at: "2026-02-27 14:00",
    lines: [
      "Constantes de contexto movidas para context.constants.ts (sem 'use server')",
      "Corrigido erro de build Next.js: arquivos 'use server' não podem exportar consts/tipos",
    ],
  },
  {
    id: "0006",
    at: "2026-02-27 11:00",
    lines: [
      "Tabela user_contexts criada: contexto ativo do SUPER_ADMIN persistido no banco de dados",
      "setActiveContext com upsert DB + cookie como cache; validação e auto-reset de agencyId",
      "getActiveAgencyIdOrThrow() unificado para AGENCY_* e SUPER_ADMIN; JWT callback atualizado",
    ],
  },
  {
    id: "0005",
    at: "2026-02-27 09:00",
    lines: [
      "Context switcher no topbar: dropdown Platform / Agência exclusivo para SUPER_ADMIN",
      "Banner índigo ao operar no contexto de agência; sidebar dinâmico por escopo ativo",
      "Middleware garante cookie de escopo para SUPER_ADMIN acessar /agency/*",
    ],
  },
  {
    id: "0004",
    at: "2026-02-26 16:00",
    lines: [
      "Hard enforcement de limites por plano: clients, deals e tickets bloqueados ao atingir limite",
      "plans.limits JSONB adicionado; painel de uso (Uso do Plano) em /admin/agencies/[id]",
    ],
  },
  {
    id: "0003",
    at: "2026-02-26 14:00",
    lines: [
      "Rebranding para 360growth; Config Center aprimorado com drawer de histórico de auditoria",
      "Seed de configurações e feature flags; botões de histórico nas tabelas do admin",
    ],
  },
  {
    id: "0002",
    at: "2026-02-26 10:00",
    lines: [
      "Config Center: CRUD de configurações da plataforma e feature flags por agência",
      "Tabela audit_logs criada; logs registrados em todas as mutações críticas do admin",
    ],
  },
  {
    id: "0001",
    at: "2026-02-25 10:00",
    lines: [
      "Setup inicial: Next.js 14 App Router, Drizzle ORM, NextAuth v5, Tailwind + shadcn/ui",
      "Multi-tenancy com roles SUPER_ADMIN / AGENCY_ADMIN / AGENCY_MEMBER / CLIENT",
      "Estrutura de rotas /admin, /agency, /portal com layouts, sidebars e middleware de auth",
    ],
  },
];
