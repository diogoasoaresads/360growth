
// ─── Types ────────────────────────────────────────────────────────────────────

export type NavItem = {
  label: string;
  href?: string;
  icon?: string;
  /** Exact match for active detection (default: startsWith) */
  exact?: boolean;
  children?: NavItem[];
};

export type NavGroup = {
  label: string;
  children: NavItem[];
};

// ─── Platform (PO / SUPER_ADMIN) ─────────────────────────────────────────────

const platformNav: NavGroup[] = [
  {
    label: "Visão Geral",
    children: [
      { label: "Dashboard", href: "/admin", icon: "dashboard", exact: true },
    ],
  },
  {
    label: "Organização",
    children: [
      { label: "Agências", href: "/admin/agencies", icon: "agencies" },
      { label: "Usuários", href: "/admin/users", icon: "users" },
      { label: "Tickets", href: "/admin/tickets", icon: "tickets" },
    ],
  },
  {
    label: "Financeiro",
    children: [
      { label: "Planos", href: "/admin/plans", icon: "plans" },
      { label: "Faturamento", href: "/admin/billing", icon: "billing" },
    ],
  },
  {
    label: "Configurações",
    children: [
      { label: "Configurações", href: "/admin/settings", icon: "settings" },
      { label: "Config Center", href: "/admin/config", icon: "config" },
      { label: "Templates", href: "/admin/templates", icon: "templates" },
      { label: "Logs", href: "/admin/logs", icon: "logs" },
    ],
  },
  {
    label: "Sistema",
    children: [
      { label: "Health", href: "/admin/health", icon: "health" },
      { label: "Jobs", href: "/admin/system/jobs", icon: "jobs" },
      { label: "DB Migrate", href: "/admin/system/db-migrate", icon: "db" },
      { label: "Integrações", href: "/admin/integrations", icon: "integrations" },
      { label: "QA Setup", href: "/admin/system/qa", icon: "qa" },
    ],
  },
];

// ─── Agency & Client (placeholders — activated in future packages) ────────────

const agencyNav: NavGroup[] = [];  // PACOTE 2
const clientNav: NavGroup[] = [];  // PACOTE 3

// ─── Export ──────────────────────────────────────────────────────────────────

export const navigation = {
  platform: platformNav,
  agency: agencyNav,
  client: clientNav,
} as const;
