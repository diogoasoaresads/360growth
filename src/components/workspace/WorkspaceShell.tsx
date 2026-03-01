"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { UserNav } from "@/components/shared/user-nav";
import { ContextSwitcherClient } from "@/components/admin/context-switcher-client";
import { AgencyContextBanner } from "@/components/admin/agency-context-banner";
import {
  ChevronRight,
  PanelLeftClose,
  PanelLeftOpen,
  Search,
  Home,
} from "lucide-react";
import type { NavGroup } from "@/config/navigation";

// ─── Types ───────────────────────────────────────────────────────────────────

interface Agency {
  id: string;
  name: string;
}

interface WorkspaceShellProps {
  children: React.ReactNode;
  navGroups: NavGroup[];
  scope: "platform" | "agency" | "client";
  agencies: Agency[];
  activeAgencyId: string | null;
  activeAgencyName: string | null;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const SEGMENT_LABELS: Record<string, string> = {
  admin: "Admin",
  agency: "Agência",
  agencies: "Agências",
  users: "Usuários",
  plans: "Planos",
  tickets: "Tickets",
  billing: "Faturamento",
  settings: "Configurações",
  config: "Config Center",
  templates: "Templates",
  logs: "Logs",
  health: "Health",
  system: "Sistema",
  jobs: "Jobs",
  "db-migrate": "DB Migrate",
  integrations: "Integrações",
  clients: "Clientes",
  pipeline: "Pipeline",
  crm: "CRM",
  reports: "Relatórios",
  new: "Novo",
  edit: "Editar",
  dashboard: "Dashboard",
  portal: "Portal",
};

function buildBreadcrumbs(pathname: string) {
  const segments = pathname.split("/").filter(Boolean);
  const crumbs: { label: string; href: string }[] = [];
  let href = "";
  for (const seg of segments) {
    href += `/${seg}`;
    const isId = /^[0-9a-f-]{8,}$/i.test(seg) || /^\d+$/.test(seg);
    crumbs.push({ label: isId ? "Detalhes" : (SEGMENT_LABELS[seg] ?? seg), href });
  }
  return crumbs;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

/** A single nav link inside a group */
function NavLink({
  item,
  collapsed,
  pathname,
}: {
  item: NavGroup["children"][number];
  collapsed: boolean;
  pathname: string;
}) {
  if (!item.href) return null;
  const Icon = item.icon;
  const isActive = item.exact
    ? pathname === item.href
    : pathname.startsWith(item.href);

  const linkContent = (
    <Link
      href={item.href}
      className={cn(
        "flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm transition-colors",
        isActive
          ? "bg-primary text-primary-foreground font-medium"
          : "text-sidebar-foreground hover:bg-sidebar-accent"
      )}
    >
      {Icon && (
        <Icon
          className={cn(
            "h-4 w-4 flex-shrink-0",
            isActive ? "text-primary-foreground" : "text-sidebar-foreground/70"
          )}
        />
      )}
      {!collapsed && <span className="truncate">{item.label}</span>}
    </Link>
  );

  if (collapsed && Icon) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>{linkContent}</TooltipTrigger>
        <TooltipContent side="right" className="text-xs">
          {item.label}
        </TooltipContent>
      </Tooltip>
    );
  }

  return linkContent;
}

/** A collapsible nav group */
function NavGroupSection({
  group,
  collapsed,
  pathname,
}: {
  group: NavGroup;
  collapsed: boolean;
  pathname: string;
}) {
  const [open, setOpen] = useState(true);

  const hasActiveChild = group.children.some((c) =>
    c.href
      ? c.exact
        ? pathname === c.href
        : pathname.startsWith(c.href)
      : false
  );

  return (
    <div className="space-y-0.5">
      {/* Group header — hidden when sidebar is collapsed */}
      {!collapsed && (
        <button
          onClick={() => setOpen((v) => !v)}
          className="flex w-full items-center justify-between px-2.5 py-1.5 text-[10px] font-semibold uppercase tracking-widest text-sidebar-foreground/40 hover:text-sidebar-foreground/60 transition-colors"
        >
          <span>{group.label}</span>
          <ChevronRight
            className={cn(
              "h-3 w-3 transition-transform",
              open && "rotate-90"
            )}
          />
        </button>
      )}

      {/* Collapsed: always show items; expanded: respect open state */}
      {(collapsed || open) && (
        <div className={cn("space-y-0.5", collapsed && hasActiveChild && "rounded-md ring-1 ring-primary/20")}>
          {group.children.map((item) => (
            <NavLink
              key={item.href ?? item.label}
              item={item}
              collapsed={collapsed}
              pathname={pathname}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/** Topbar breadcrumb */
function Topbar({
  scope,
  agencies,
  activeAgencyId,
  activeAgencyName,
}: {
  scope: WorkspaceShellProps["scope"];
  agencies: Agency[];
  activeAgencyId: string | null;
  activeAgencyName: string | null;
}) {
  const pathname = usePathname();
  const crumbs = buildBreadcrumbs(pathname);

  return (
    <header className="flex h-13 shrink-0 items-center justify-between border-b bg-background px-4 gap-4">
      {/* Breadcrumb */}
      <nav className="flex min-w-0 items-center gap-1 text-sm overflow-hidden">
        <Link href="/admin" className="shrink-0 text-muted-foreground hover:text-foreground transition-colors">
          <Home className="h-3.5 w-3.5" />
        </Link>
        {crumbs.map((crumb, i) => (
          <span key={crumb.href} className="flex items-center gap-1 min-w-0">
            <ChevronRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground/40" />
            {i === crumbs.length - 1 ? (
              <span className="truncate font-medium text-foreground">{crumb.label}</span>
            ) : (
              <Link
                href={crumb.href}
                className="truncate text-muted-foreground hover:text-foreground transition-colors"
              >
                {crumb.label}
              </Link>
            )}
          </span>
        ))}
      </nav>

      {/* Right side */}
      <div className="flex shrink-0 items-center gap-2">
        {/* Search placeholder */}
        <div className="hidden md:flex items-center gap-1.5 rounded-md border bg-muted/40 px-2.5 py-1.5 text-xs text-muted-foreground w-44">
          <Search className="h-3.5 w-3.5" />
          <span>Buscar…</span>
          <kbd className="ml-auto text-[10px] font-mono rounded bg-background border px-1">⌘K</kbd>
        </div>

        {/* Context switcher */}
        <ContextSwitcherClient
          agencies={agencies}
          activeScope={scope}
          activeAgencyId={activeAgencyId}
          activeAgencyName={activeAgencyName}
        />
      </div>
    </header>
  );
}

// ─── Shell ────────────────────────────────────────────────────────────────────

export function WorkspaceShell({
  children,
  navGroups,
  scope,
  agencies,
  activeAgencyId,
  activeAgencyName,
}: WorkspaceShellProps) {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();

  return (
    <TooltipProvider delayDuration={200}>
      <div className="flex h-screen overflow-hidden bg-muted/20">
        {/* ── Sidebar ────────────────────────────────────────────────── */}
        <aside
          className={cn(
            "flex h-full flex-col border-r bg-sidebar transition-all duration-200 ease-in-out",
            collapsed ? "w-[60px]" : "w-[240px]"
          )}
        >
          {/* Logo / brand */}
          <div className="flex h-13 shrink-0 items-center border-b px-3">
            <Link
              href="/admin"
              className={cn(
                "flex items-center gap-2.5 min-w-0",
                collapsed && "justify-center"
              )}
            >
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-primary">
                <span className="text-xs font-bold text-primary-foreground">3</span>
              </div>
              {!collapsed && (
                <div className="min-w-0">
                  <p className="text-sm font-bold leading-none text-sidebar-foreground truncate">
                    360growth
                  </p>
                  <p className="text-[10px] text-sidebar-foreground/50 uppercase tracking-wider mt-0.5">
                    {scope === "agency" ? "Agência" : "Plataforma"}
                  </p>
                </div>
              )}
            </Link>
          </div>

          {/* Nav groups */}
          <ScrollArea className="flex-1 py-3">
            <nav className={cn("space-y-4", collapsed ? "px-2" : "px-3")}>
              {navGroups.map((group) => (
                <NavGroupSection
                  key={group.label}
                  group={group}
                  collapsed={collapsed}
                  pathname={pathname}
                />
              ))}
            </nav>
          </ScrollArea>

          {/* Collapse toggle + user */}
          <div className={cn("shrink-0 border-t", collapsed ? "p-2 space-y-2" : "p-3 space-y-2")}>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setCollapsed((v) => !v)}
              className={cn(
                "h-8 w-full gap-2 text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent",
                collapsed && "justify-center px-0"
              )}
            >
              {collapsed ? (
                <PanelLeftOpen className="h-4 w-4" />
              ) : (
                <>
                  <PanelLeftClose className="h-4 w-4" />
                  <span className="text-xs">Recolher</span>
                </>
              )}
            </Button>
            {!collapsed && <UserNav />}
          </div>
        </aside>

        {/* ── Main area ──────────────────────────────────────────────── */}
        <div className="flex flex-1 flex-col overflow-hidden">
          <Topbar
            scope={scope}
            agencies={agencies}
            activeAgencyId={activeAgencyId}
            activeAgencyName={activeAgencyName}
          />

          {scope === "agency" && activeAgencyName && (
            <AgencyContextBanner agencyName={activeAgencyName} />
          )}

          <main className="flex-1 overflow-auto p-6">
            {children}
          </main>
        </div>
      </div>
    </TooltipProvider>
  );
}
