"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { UserNav } from "./user-nav";
import {
  LayoutDashboard,
  Users,
  TicketIcon,
  BarChart3,
  Settings,
  ChevronRight,
  ChevronDown,
} from "lucide-react";
import { useState } from "react";

type NavItem = {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  children?: { label: string; href: string }[];
};

const navItems: NavItem[] = [
  {
    label: "Dashboard",
    href: "/agency/dashboard",
    icon: LayoutDashboard,
  },
  {
    label: "CRM",
    href: "/agency/crm",
    icon: Users,
    children: [
      { label: "Pipeline", href: "/agency/crm/pipeline" },
      { label: "Clientes", href: "/agency/crm/clients" },
      { label: "Contatos", href: "/agency/crm/contacts" },
    ],
  },
  {
    label: "Tickets",
    href: "/agency/tickets",
    icon: TicketIcon,
  },
  {
    label: "Relatórios",
    href: "/agency/reports",
    icon: BarChart3,
  },
  {
    label: "Configurações",
    href: "/agency/settings",
    icon: Settings,
  },
];

export function AgencySidebar() {
  const pathname = usePathname();
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({
    "/agency/crm": pathname.startsWith("/agency/crm"),
  });

  function toggleGroup(href: string) {
    setOpenGroups((prev) => ({ ...prev, [href]: !prev[href] }));
  }

  return (
    <aside className="flex h-screen w-64 flex-col bg-sidebar border-r border-sidebar-border">
      {/* Logo */}
      <div className="flex h-16 items-center px-6">
        <Link href="/agency/dashboard" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
            <span className="text-sm font-bold text-primary-foreground">A</span>
          </div>
          <div>
            <p className="text-sm font-bold text-sidebar-foreground">AgencyHub</p>
            <p className="text-[10px] text-sidebar-foreground/60 uppercase tracking-wider">
              Agência
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
            const isActive = pathname.startsWith(item.href);
            const isOpen = openGroups[item.href];

            if (item.children) {
              return (
                <div key={item.href}>
                  <button
                    onClick={() => toggleGroup(item.href)}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors",
                      isActive
                        ? "bg-sidebar-accent text-sidebar-accent-foreground"
                        : "text-sidebar-foreground hover:bg-sidebar-accent"
                    )}
                  >
                    <Icon className="h-4 w-4 flex-shrink-0" />
                    <span className="flex-1 text-left">{item.label}</span>
                    {isOpen ? (
                      <ChevronDown className="h-3 w-3 opacity-60" />
                    ) : (
                      <ChevronRight className="h-3 w-3 opacity-60" />
                    )}
                  </button>
                  {isOpen && (
                    <div className="ml-7 mt-1 space-y-1 border-l border-sidebar-border pl-3">
                      {item.children.map((child) => {
                        const isChildActive = pathname === child.href;
                        return (
                          <Link
                            key={child.href}
                            href={child.href}
                            className={cn(
                              "flex items-center rounded-lg px-3 py-2 text-sm transition-colors",
                              isChildActive
                                ? "bg-sidebar-primary text-sidebar-primary-foreground"
                                : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                            )}
                          >
                            {child.label}
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            }

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
