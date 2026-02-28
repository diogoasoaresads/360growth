/** Incremental build identifier — bump on every release. */
export const BUILD_ID = "0010";

/** Timestamp of the last release (YYYY-MM-DD HH:mm). */
export const UPDATED_AT = "2026-02-28 09:15";

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
