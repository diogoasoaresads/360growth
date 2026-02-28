"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { UserNav } from "./user-nav";
import {
  LayoutDashboard,
  Building2,
  CreditCard,
  Ticket,
  Users,
  Settings,
  ChevronRight,
  DollarSign,
  ScrollText,
  SlidersHorizontal,
  BarChart3,
  Mail,
} from "lucide-react";

const adminNavItems = [
  { label: "Dashboard",      href: "/admin",           icon: LayoutDashboard, exact: true },
  { label: "Agências",       href: "/admin/agencies",  icon: Building2 },
  { label: "Planos",         href: "/admin/plans",     icon: CreditCard },
  { label: "Usuários",       href: "/admin/users",     icon: Users },
  { label: "Tickets",        href: "/admin/tickets",   icon: Ticket },
  { label: "Faturamento",    href: "/admin/billing",   icon: DollarSign },
  { label: "Configurações",  href: "/admin/settings",  icon: Settings },
  { label: "Config Center",  href: "/admin/config",    icon: SlidersHorizontal },
  { label: "Templates",      href: "/admin/templates", icon: Mail },
  { label: "Logs",           href: "/admin/logs",      icon: ScrollText },
];

const agencyNavItems = [
  { label: "Dashboard",  href: "/agency/dashboard",    icon: LayoutDashboard, exact: true },
  { label: "Clientes",   href: "/agency/crm/clients",  icon: Users },
  { label: "Pipeline",   href: "/agency/crm/pipeline", icon: BarChart3 },
  { label: "Tickets",    href: "/agency/tickets",      icon: Ticket },
];

interface SuperAdminSidebarProps {
  activeScope?: "platform" | "agency";
}

export function SuperAdminSidebar({ activeScope = "platform" }: SuperAdminSidebarProps) {
  const pathname = usePathname();
  const navItems = activeScope === "agency" ? agencyNavItems : adminNavItems;
  const homeHref = activeScope === "agency" ? "/agency/dashboard" : "/admin";
  const subtitle = activeScope === "agency" ? "Modo Agência" : "Super Admin";

  return (
    <aside className="flex h-screen w-64 flex-col bg-sidebar border-r border-sidebar-border">
      {/* Logo */}
      <div className="flex h-16 items-center px-6">
        <Link href={homeHref} className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
            <span className="text-sm font-bold text-primary-foreground">3</span>
          </div>
          <div>
            <p className="text-sm font-bold text-sidebar-foreground">360growth</p>
            <p
              className={cn(
                "text-[10px] uppercase tracking-wider",
                activeScope === "agency"
                  ? "text-indigo-400"
                  : "text-sidebar-foreground/60"
              )}
            >
              {subtitle}
            </p>
          </div>
        </Link>
      </div>

      <Separator className="bg-sidebar-border" />

      {/* Navigation */}
      <ScrollArea className="flex-1 px-3 py-4">
        <nav className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = item.exact
              ? pathname === item.href
              : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors group",
                  isActive
                    ? "bg-sidebar-primary text-sidebar-primary-foreground"
                    : "text-sidebar-foreground hover:bg-sidebar-accent"
                )}
              >
                <Icon className="h-4 w-4 flex-shrink-0" />
                <span className="flex-1">{item.label}</span>
                {isActive && <ChevronRight className="h-3 w-3 opacity-60" />}
              </Link>
            );
          })}
        </nav>
      </ScrollArea>

      <Separator className="bg-sidebar-border" />

      {/* User Nav */}
      <div className="p-3">
        <UserNav />
      </div>
    </aside>
  );
}
