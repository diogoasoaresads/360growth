"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { useSession } from "next-auth/react";
import { ChevronRight, Home, LogOut, Settings, User } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ContextSwitcherClient } from "@/components/admin/context-switcher-client";

// Mapeamento de segmentos de URL para labels em PT-BR
const SEGMENT_LABELS: Record<string, string> = {
  "super-admin": "Super Admin",
  dashboard: "Dashboard",
  agencies: "Agências",
  users: "Usuários",
  plans: "Planos",
  tickets: "Tickets",
  settings: "Configurações",
  agency: "Agência",
  crm: "CRM",
  pipeline: "Pipeline",
  clients: "Clientes",
  contacts: "Contatos",
  reports: "Relatórios",
  portal: "Portal",
  new: "Novo",
  edit: "Editar",
};

function buildBreadcrumbs(pathname: string) {
  const segments = pathname.split("/").filter(Boolean);
  const crumbs: { label: string; href: string }[] = [];
  let href = "";

  for (const segment of segments) {
    href += `/${segment}`;
    // Skip UUIDs and numeric IDs
    const isId = /^[0-9a-f-]{8,}$/i.test(segment) || /^\d+$/.test(segment);
    crumbs.push({
      label: isId ? "Detalhes" : (SEGMENT_LABELS[segment] ?? segment),
      href,
    });
  }
  return crumbs;
}

interface Agency {
  id: string;
  name: string;
}

interface AdminHeaderProps {
  agencies?: Agency[];
  activeScope?: "platform" | "agency";
  activeAgencyId?: string | null;
  activeAgencyName?: string | null;
}

export function AdminHeader({
  agencies = [],
  activeScope = "platform",
  activeAgencyId = null,
  activeAgencyName = null,
}: AdminHeaderProps) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const breadcrumbs = buildBreadcrumbs(pathname);
  const user = session?.user;

  const initials = user?.name
    ? user.name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase()
    : "??";

  return (
    <header className="flex h-14 items-center justify-between border-b bg-background px-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1 text-sm">
        <Link href="/" className="text-muted-foreground hover:text-foreground transition-colors">
          <Home className="h-3.5 w-3.5" />
        </Link>
        {breadcrumbs.map((crumb, i) => (
          <span key={crumb.href} className="flex items-center gap-1">
            <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/50" />
            {i === breadcrumbs.length - 1 ? (
              <span className="font-medium text-foreground">{crumb.label}</span>
            ) : (
              <Link
                href={crumb.href}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                {crumb.label}
              </Link>
            )}
          </span>
        ))}
      </nav>

      {/* Right side: Context Switcher + User menu */}
      <div className="flex items-center gap-3">
        <ContextSwitcherClient
          agencies={agencies}
          activeScope={activeScope}
          activeAgencyId={activeAgencyId}
          activeAgencyName={activeAgencyName}
        />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm hover:bg-muted transition-colors outline-none">
              <Avatar className="h-7 w-7">
                <AvatarImage src={user?.image ?? undefined} />
                <AvatarFallback className="text-xs bg-primary text-primary-foreground">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <span className="max-w-[140px] truncate font-medium hidden sm:block">
                {user?.name ?? "Usuário"}
              </span>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">{user?.name}</p>
                <p className="text-xs leading-none text-muted-foreground">{user?.email}</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <User className="mr-2 h-4 w-4" />
              Perfil
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Settings className="mr-2 h-4 w-4" />
              Configurações
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-destructive focus:text-destructive"
              onClick={() => signOut({ callbackUrl: "/login" })}
            >
              <LogOut className="mr-2 h-4 w-4" />
              Sair
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
