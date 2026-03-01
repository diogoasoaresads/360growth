"use client";

import { useState } from "react";
import type { IntegrationJob } from "@/lib/db/schema";
import { formatDuration } from "@/lib/integrations/jobs/engine";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { CheckCircle2, XCircle, Loader2, Clock } from "lucide-react";

type JobWithOwner = IntegrationJob & { agencyName?: string | null };

interface Props {
  jobs: JobWithOwner[];
  providers: string[];
}

export function JobsClient({ jobs, providers }: Props) {
  const [providerFilter, setProviderFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [selected, setSelected] = useState<JobWithOwner | null>(null);

  const filtered = jobs.filter((j) => {
    if (providerFilter !== "all" && j.provider !== providerFilter) return false;
    if (statusFilter !== "all" && j.status !== statusFilter) return false;
    if (typeFilter !== "all" && j.type !== typeFilter) return false;
    return true;
  });

  function durationCell(job: IntegrationJob) {
    if (!job.startedAt || !job.finishedAt) return "—";
    const ms = job.finishedAt.getTime() - job.startedAt.getTime();
    return formatDuration(ms);
  }

  return (
    <>
      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <Select value={providerFilter} onValueChange={setProviderFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Provider" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os providers</SelectItem>
            {providers.map((p) => (
              <SelectItem key={p} value={p}>
                {p}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os status</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="running">Running</SelectItem>
            <SelectItem value="success">Success</SelectItem>
            <SelectItem value="failed">Failed</SelectItem>
          </SelectContent>
        </Select>

        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os tipos</SelectItem>
            <SelectItem value="test">Teste</SelectItem>
            <SelectItem value="sync">Sync</SelectItem>
            <SelectItem value="health_check">Health Check</SelectItem>
            <SelectItem value="custom">Custom</SelectItem>
          </SelectContent>
        </Select>

        <span className="text-sm text-muted-foreground self-center">
          {filtered.length} job{filtered.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Table */}
      <div className="rounded-md border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-36">Quando</TableHead>
              <TableHead>Provider</TableHead>
              <TableHead>Agência</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-20">Duração</TableHead>
              <TableHead>Erro</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="text-center text-muted-foreground py-10"
                >
                  Nenhum job encontrado.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((job) => (
                <TableRow
                  key={job.id}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => setSelected(job)}
                >
                  <TableCell className="text-xs whitespace-nowrap">
                    {new Date(job.createdAt).toLocaleString("pt-BR", {
                      day: "2-digit",
                      month: "2-digit",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </TableCell>
                  <TableCell>
                    <span className="font-mono text-xs">{job.provider}</span>
                  </TableCell>
                  <TableCell className="text-xs max-w-[140px] truncate">
                    {job.agencyName ?? job.ownerId.slice(0, 8) + "…"}
                  </TableCell>
                  <TableCell>
                    <TypeBadge type={job.type} />
                  </TableCell>
                  <TableCell>
                    <StatusCell status={job.status} />
                  </TableCell>
                  <TableCell className="text-xs">{durationCell(job)}</TableCell>
                  <TableCell className="text-xs text-destructive max-w-[160px] truncate">
                    {job.lastError ?? "—"}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Detail modal */}
      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        {selected && (
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>
                Job {selected.type} — {selected.provider}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 text-sm">
              <dl className="grid grid-cols-2 gap-x-4 gap-y-2">
                <dt className="text-muted-foreground">Status</dt>
                <dd>
                  <StatusCell status={selected.status} />
                </dd>
                <dt className="text-muted-foreground">Criado em</dt>
                <dd>{new Date(selected.createdAt).toLocaleString("pt-BR")}</dd>
                <dt className="text-muted-foreground">Iniciado</dt>
                <dd>
                  {selected.startedAt
                    ? new Date(selected.startedAt).toLocaleString("pt-BR")
                    : "—"}
                </dd>
                <dt className="text-muted-foreground">Finalizado</dt>
                <dd>
                  {selected.finishedAt
                    ? new Date(selected.finishedAt).toLocaleString("pt-BR")
                    : "—"}
                </dd>
                <dt className="text-muted-foreground">Duração</dt>
                <dd>{durationCell(selected)}</dd>
                <dt className="text-muted-foreground">Tentativas</dt>
                <dd>{selected.attempts}</dd>
                <dt className="text-muted-foreground">Agência</dt>
                <dd className="font-mono text-xs break-all">
                  {selected.agencyName ?? selected.ownerId}
                </dd>
                <dt className="text-muted-foreground">Integration ID</dt>
                <dd className="font-mono text-xs break-all">
                  {selected.integrationId}
                </dd>
              </dl>

              {selected.lastError && (
                <div className="space-y-1">
                  <p className="text-muted-foreground">Erro</p>
                  <p className="text-destructive text-xs break-all rounded bg-destructive/10 p-2">
                    {selected.lastError}
                  </p>
                </div>
              )}

              {!!selected.meta && (
                <div className="space-y-1">
                  <p className="text-muted-foreground">Meta</p>
                  <pre className="text-xs bg-muted p-2 rounded overflow-x-auto">
                    {JSON.stringify(selected.meta, null, 2)}
                  </pre>
                </div>
              )}
            </div>
            <div className="flex justify-end">
              <Button variant="outline" onClick={() => setSelected(null)}>
                Fechar
              </Button>
            </div>
          </DialogContent>
        )}
      </Dialog>
    </>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function StatusCell({ status }: { status: string }) {
  const map: Record<
    string,
    { icon: React.ReactNode; label: string; className: string }
  > = {
    success: {
      icon: <CheckCircle2 className="h-3.5 w-3.5" />,
      label: "Success",
      className: "bg-green-100 text-green-800 border-green-200",
    },
    failed: {
      icon: <XCircle className="h-3.5 w-3.5" />,
      label: "Failed",
      className: "bg-red-100 text-red-800 border-red-200",
    },
    running: {
      icon: <Loader2 className="h-3.5 w-3.5 animate-spin" />,
      label: "Running",
      className: "bg-blue-100 text-blue-800 border-blue-200",
    },
    pending: {
      icon: <Clock className="h-3.5 w-3.5" />,
      label: "Pending",
      className: "bg-gray-100 text-gray-600 border-gray-200",
    },
  };
  const cfg = map[status] ?? map["pending"]!;
  return (
    <Badge
      variant="outline"
      className={`flex items-center gap-1 w-fit ${cfg.className}`}
    >
      {cfg.icon}
      {cfg.label}
    </Badge>
  );
}

function TypeBadge({ type }: { type: string }) {
  const labels: Record<string, string> = {
    test: "Teste",
    sync: "Sync",
    health_check: "Health",
    custom: "Custom",
  };
  return (
    <Badge variant="secondary" className="text-xs">
      {labels[type] ?? type}
    </Badge>
  );
}
