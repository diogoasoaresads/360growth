"use client";

import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { ConfigAuditLogEntry } from "@/lib/actions/admin/config";

const ACTION_LABELS: Record<string, string> = {
  "platform_setting.created": "Config criada",
  "platform_setting.updated": "Config atualizada",
  "platform_setting.deleted": "Config deletada",
  "feature_flag.created": "Flag criada",
  "feature_flag.updated": "Flag atualizada",
  "feature_flag.deleted": "Flag deletada",
  "feature_flag.override_set": "Override definido",
  "settings.updated": "Configurações atualizadas",
};

const ACTION_COLORS: Record<string, string> = {
  "platform_setting.created": "bg-blue-100 text-blue-800",
  "platform_setting.updated": "bg-amber-100 text-amber-800",
  "platform_setting.deleted": "bg-red-100 text-red-800",
  "feature_flag.created": "bg-violet-100 text-violet-800",
  "feature_flag.updated": "bg-indigo-100 text-indigo-800",
  "feature_flag.deleted": "bg-red-100 text-red-800",
  "feature_flag.override_set": "bg-cyan-100 text-cyan-800",
  "settings.updated": "bg-gray-100 text-gray-800",
};

function formatDate(d: Date) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(d));
}

interface ConfigAuditLogsProps {
  data: ConfigAuditLogEntry[];
}

export function ConfigAuditLogs({ data }: ConfigAuditLogsProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Últimas {data.length} ações relacionadas a configurações da plataforma.
        </p>
        <Button variant="outline" size="sm" asChild>
          <Link href="/admin/logs?categories=platform_setting,feature_flag,settings">
            <ExternalLink className="h-3.5 w-3.5 mr-1.5" />
            Ver todos os logs
          </Link>
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Data</TableHead>
              <TableHead>Usuário</TableHead>
              <TableHead>Ação</TableHead>
              <TableHead>Recurso</TableHead>
              <TableHead>Detalhes</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-32 text-center text-muted-foreground">
                  Nenhum log de configuração encontrado.
                </TableCell>
              </TableRow>
            ) : (
              data.map((row) => (
                <TableRow key={row.id}>
                  <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                    {formatDate(row.createdAt)}
                  </TableCell>
                  <TableCell className="text-sm">
                    {row.userName ?? row.userEmail ?? "—"}
                  </TableCell>
                  <TableCell>
                    <span
                      className={`inline-flex rounded px-2 py-0.5 text-xs font-medium ${
                        ACTION_COLORS[row.action] ?? "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {ACTION_LABELS[row.action] ?? row.action}
                    </span>
                  </TableCell>
                  <TableCell className="font-mono text-xs">
                    {row.entityId ?? "—"}
                  </TableCell>
                  <TableCell className="max-w-xs text-xs text-muted-foreground">
                    {row.metadata ? (
                      <span className="font-mono truncate block max-w-[240px]">
                        {JSON.stringify(row.metadata)}
                      </span>
                    ) : (
                      "—"
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
