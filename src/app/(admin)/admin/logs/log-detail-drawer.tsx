"use client";

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { AuditLogEntry } from "@/lib/actions/admin/logs";
import { getActionCategory, ACTION_CATEGORIES } from "@/lib/log-utils";

const CATEGORY_CLASS: Record<string, string> = {
  agency: "bg-blue-100 text-blue-800",
  user: "bg-green-100 text-green-800",
  plan: "bg-purple-100 text-purple-800",
  subscription: "bg-amber-100 text-amber-800",
  ticket: "bg-cyan-100 text-cyan-800",
  settings: "bg-gray-100 text-gray-800",
  platform_setting: "bg-indigo-100 text-indigo-800",
  feature_flag: "bg-violet-100 text-violet-800",
  auth: "bg-red-100 text-red-800",
};

function JsonBlock({ label, value }: { label: string; value: unknown }) {
  if (value === undefined || value === null) return null;
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
        {label}
      </p>
      <pre className="rounded-md bg-muted px-3 py-2 text-[11px] leading-relaxed overflow-auto max-h-64 whitespace-pre-wrap break-all">
        {typeof value === "string" ? value : JSON.stringify(value, null, 2)}
      </pre>
    </div>
  );
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex gap-2">
      <span className="text-xs text-muted-foreground w-28 shrink-0 pt-0.5">{label}</span>
      <span className="text-sm">{value ?? "—"}</span>
    </div>
  );
}

interface LogDetailDrawerProps {
  log: AuditLogEntry | null;
  onClose: () => void;
}

export function LogDetailDrawer({ log, onClose }: LogDetailDrawerProps) {
  if (!log) return null;

  const cat = getActionCategory(log.action);
  const catLabel = cat ? ACTION_CATEGORIES[cat].label : null;
  const catClass = cat ? (CATEGORY_CLASS[cat] ?? "") : "";

  const metadata = log.metadata;
  const before = metadata && typeof metadata === "object" && "before" in metadata
    ? metadata.before
    : undefined;
  const after = metadata && typeof metadata === "object" && "after" in metadata
    ? metadata.after
    : undefined;
  const hasBefore = before !== undefined;
  const hasAfter = after !== undefined;
  const otherMeta = metadata
    ? Object.fromEntries(
        Object.entries(metadata).filter(([k]) => k !== "before" && k !== "after")
      )
    : null;

  return (
    <Sheet open={!!log} onOpenChange={(open) => { if (!open) onClose(); }}>
      <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
        <SheetHeader className="pb-4">
          <SheetTitle className="text-base">Detalhe do Log</SheetTitle>
        </SheetHeader>

        <div className="space-y-4 text-sm">
          {/* Action badge */}
          <div className="flex items-center gap-2 flex-wrap">
            {catLabel && (
              <Badge className={`text-xs ${catClass}`}>{catLabel}</Badge>
            )}
            <span className="font-mono text-xs bg-muted rounded px-2 py-0.5">{log.action}</span>
          </div>

          <Separator />

          {/* Core fields */}
          <div className="space-y-2">
            <Field
              label="Timestamp"
              value={format(new Date(log.createdAt), "dd/MM/yyyy HH:mm:ss", { locale: ptBR })}
            />
            <Field
              label="Usuário"
              value={
                log.user ? (
                  <span>
                    {log.user.name ?? "—"}{" "}
                    <span className="text-muted-foreground text-xs">({log.user.email})</span>
                    <span className="ml-1 font-mono text-[10px] text-muted-foreground">[{log.user.id}]</span>
                  </span>
                ) : (
                  <span className="text-muted-foreground">Sistema</span>
                )
              }
            />
            {log.agencyName && (
              <Field
                label="Agência"
                value={
                  <span>
                    {log.agencyName}{" "}
                    <span className="font-mono text-[10px] text-muted-foreground">[{log.agencyId}]</span>
                  </span>
                }
              />
            )}
            {log.entityType && (
              <Field
                label="Entidade"
                value={
                  <span>
                    <span className="text-muted-foreground">{log.entityType}: </span>
                    <span className="font-mono text-xs">{log.entityId ?? "—"}</span>
                  </span>
                }
              />
            )}
            <Field label="IP" value={log.ipAddress} />
            <Field
              label="User-Agent"
              value={
                log.userAgent ? (
                  <span className="text-xs text-muted-foreground truncate block max-w-xs" title={log.userAgent}>
                    {log.userAgent}
                  </span>
                ) : null
              }
            />
          </div>

          {/* Before / After */}
          {(hasBefore || hasAfter) && (
            <>
              <Separator />
              <div className="space-y-3">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Alterações
                </p>
                {hasBefore && <JsonBlock label="Antes" value={before} />}
                {hasAfter && <JsonBlock label="Depois" value={after} />}
              </div>
            </>
          )}

          {/* Other metadata */}
          {otherMeta && Object.keys(otherMeta).length > 0 && (
            <>
              <Separator />
              <JsonBlock label="Metadados adicionais" value={otherMeta} />
            </>
          )}

          {/* Log ID */}
          <Separator />
          <p className="text-[10px] text-muted-foreground font-mono">ID: {log.id}</p>
        </div>
      </SheetContent>
    </Sheet>
  );
}
