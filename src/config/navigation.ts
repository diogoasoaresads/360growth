import type { ComponentType } from "react";
import {
  LayoutDashboard,
  Building2,
  Users,
  CreditCard,
  DollarSign,
  Plug,
  Zap,
  Activity,
  DatabaseZap,
  Settings,
  SlidersHorizontal,
  Mail,
  ScrollText,
  Ticket,
  FlaskConical,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

export type NavItem = {
  label: string;
  href?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  icon?: ComponentType<any>;
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
      { label: "Dashboard", href: "/admin", icon: LayoutDashboard, exact: true },
    ],
  },
  {
    label: "Organização",
    children: [
      { label: "Agências",  href: "/admin/agencies", icon: Building2 },
      { label: "Usuários",  href: "/admin/users",    icon: Users },
      { label: "Tickets",   href: "/admin/tickets",  icon: Ticket },
    ],
  },
  {
    label: "Financeiro",
    children: [
      { label: "Planos",      href: "/admin/plans",    icon: CreditCard },
      { label: "Faturamento", href: "/admin/billing",  icon: DollarSign },
    ],
  },
  {
    label: "Configurações",
    children: [
      { label: "Configurações", href: "/admin/settings",  icon: Settings },
      { label: "Config Center", href: "/admin/config",    icon: SlidersHorizontal },
      { label: "Templates",     href: "/admin/templates", icon: Mail },
      { label: "Logs",          href: "/admin/logs",      icon: ScrollText },
    ],
  },
  {
    label: "Sistema",
    children: [
      { label: "Health",     href: "/admin/health",              icon: Activity },
      { label: "Jobs",       href: "/admin/system/jobs",         icon: Zap },
      { label: "DB Migrate", href: "/admin/system/db-migrate",   icon: DatabaseZap },
      { label: "Integrações", href: "/admin/integrations",       icon: Plug },
      { label: "QA Setup",   href: "/admin/system/qa",           icon: FlaskConical },
    ],
  },
];

// ─── Agency & Client (placeholders — activated in future packages) ────────────

const agencyNav: NavGroup[] = [];  // PACOTE 2
const clientNav: NavGroup[] = [];  // PACOTE 3

// ─── Export ──────────────────────────────────────────────────────────────────

export const navigation = {
  platform: platformNav,
  agency:   agencyNav,
  client:   clientNav,
} as const;
