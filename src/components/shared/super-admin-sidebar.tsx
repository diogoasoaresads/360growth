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
  TicketIcon,
  Users,
  Settings,
  ChevronRight,
} from "lucide-react";

const navItems = [
  {
    label: "Dashboard",
    href: "/admin",
    icon: LayoutDashboard,
  },
  {
    label: "Agências",
    href: "/admin/agencies",
    icon: Building2,
  },
  {
    label: "Usuários",
    href: "/admin/users",
    icon: Users,
  },
  {
    label: "Planos",
    href: "/admin/plans",
    icon: CreditCard,
  },
  {
    label: "Tickets",
    href: "/admin/tickets",
    icon: TicketIcon,
  },
  {
    label: "Configurações",
    href: "/super-admin/settings",
    icon: Settings,
  },
];

export function SuperAdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex h-screen w-64 flex-col bg-sidebar border-r border-sidebar-border">
      {/* Logo */}
      <div className="flex h-16 items-center px-6">
        <Link href="/admin" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
            <span className="text-sm font-bold text-primary-foreground">A</span>
          </div>
          <div>
            <p className="text-sm font-bold text-sidebar-foreground">AgencyHub</p>
            <p className="text-[10px] text-sidebar-foreground/60 uppercase tracking-wider">
              Super Admin
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
