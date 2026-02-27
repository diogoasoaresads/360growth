"use client";

import { useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ChevronDown, ChevronRight } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { AuditLogEntry } from "@/lib/actions/admin/logs";
import { getActionCategory, ACTION_CATEGORIES } from "@/lib/log-utils";

// ─── Badge styles by category ─────────────────────────────────

const CATEGORY_CLASS: Record<string, string> = {
  agency: "bg-blue-100 text-blue-800",
  user: "bg-green-100 text-green-800",
  plan: "bg-purple-100 text-purple-800",
  subscription: "bg-amber-100 text-amber-800",
  ticket: "bg-cyan-100 text-cyan-800",
  settings: "bg-gray-100 text-gray-800",
  auth: "bg-red-100 text-red-800",
};

function ActionBadge({ action }: { action: string }) {
  const cat = getActionCategory(action);
  const label = cat ? ACTION_CATEGORIES[cat].label : action;
  const cls = cat ? (CATEGORY_CLASS[cat] ?? "") : "";
  const suffix = action.split(".").slice(1).join(".");
  return (
    <div className="flex flex-col gap-0.5">
      <Badge className={`w-fit text-xs ${cls}`}>{label}</Badge>
      <span className="font-mono text-[11px] text-muted-foreground">{suffix}</span>
    </div>
  );
}

// ─── Expandable details cell ──────────────────────────────────

function ExpandableDetails({ metadata }: { metadata: Record<string, unknown> | null }) {
  const [open, setOpen] = useState(false);

  if (!metadata || Object.keys(metadata).length === 0) {
    return <span className="text-xs text-muted-foreground">—</span>;
  }

  return (
    <div>
      <Button
        variant="ghost"
        size="sm"
        className="h-6 gap-1 px-1 text-xs text-primary"
        onClick={() => setOpen((v) => !v)}
      >
        {open ? (
          <>
            <ChevronDown className="h-3 w-3" /> Ocultar
          </>
        ) : (
          <>
            <ChevronRight className="h-3 w-3" /> Ver detalhes
          </>
        )}
      </Button>
      {open && (
        <pre className="mt-1 max-h-40 overflow-auto rounded-md bg-muted px-3 py-2 text-[11px] leading-relaxed">
          {JSON.stringify(metadata, null, 2)}
        </pre>
      )}
    </div>
  );
}

// ─── Column definitions ───────────────────────────────────────

export const columns: ColumnDef<AuditLogEntry>[] = [
  {
    accessorKey: "createdAt",
    header: "Timestamp",
    cell: ({ row }) => (
      <span className="whitespace-nowrap text-xs text-muted-foreground">
        {format(row.original.createdAt, "dd/MM/yyyy HH:mm:ss", { locale: ptBR })}
      </span>
    ),
  },
  {
    id: "user",
    header: "Usuário",
    cell: ({ row }) => {
      const user = row.original.user;
      if (!user) {
        return <span className="text-xs text-muted-foreground">Sistema</span>;
      }
      const initials = (user.name ?? user.email ?? "?")
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);
      return (
        <div className="flex items-center gap-2">
          <Avatar className="h-6 w-6">
            <AvatarImage src={user.image ?? undefined} />
            <AvatarFallback className="text-[10px]">{initials}</AvatarFallback>
          </Avatar>
          <div>
            <p className="text-sm font-medium leading-none">{user.name ?? "—"}</p>
            <p className="text-xs text-muted-foreground">{user.email ?? "—"}</p>
          </div>
        </div>
      );
    },
  },
  {
    accessorKey: "action",
    header: "Ação",
    cell: ({ row }) => <ActionBadge action={row.original.action} />,
  },
  {
    id: "resource",
    header: "Recurso",
    cell: ({ row }) => {
      const { entityType, entityId } = row.original;
      if (!entityType && !entityId) {
        return <span className="text-xs text-muted-foreground">—</span>;
      }
      return (
        <div className="text-sm">
          <span className="text-muted-foreground">{entityType}: </span>
          <span className="font-mono text-xs">
            {entityId ? entityId.slice(0, 8).toUpperCase() : "—"}
          </span>
        </div>
      );
    },
  },
  {
    accessorKey: "ipAddress",
    header: "IP",
    cell: ({ row }) => (
      <span className="font-mono text-xs text-muted-foreground">
        {row.original.ipAddress ?? "—"}
      </span>
    ),
  },
  {
    id: "details",
    header: "Detalhes",
    cell: ({ row }) => <ExpandableDetails metadata={row.original.metadata} />,
  },
];
