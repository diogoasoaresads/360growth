"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

interface AgencyTabsProps {
  agencyId: string;
}

const tabs = [
  { label: "Visão geral", href: "" },
  { label: "Membros", href: "/members" },
  { label: "Clientes", href: "/clients" },
  { label: "Assinatura", href: "/subscription" },
  { label: "Atividade", href: "/activity" },
];

export function AgencyTabs({ agencyId }: AgencyTabsProps) {
  const pathname = usePathname();
  const base = `/admin/agencies/${agencyId}`;

  return (
    <nav className="flex gap-1 border-b pb-0">
      {tabs.map((tab) => {
        const href = `${base}${tab.href}`;
        const isActive =
          tab.href === ""
            ? pathname === base
            : pathname.startsWith(href);
        return (
          <Link
            key={tab.href}
            href={href}
            className={cn(
              "px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px",
              isActive
                ? "border-primary text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
