"use client";

import { useState, useTransition, Fragment } from "react";
import { useRouter } from "next/navigation";
import { Plus, Pencil, Trash2, ChevronDown, ChevronRight, Building2, History } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { FlagDialog } from "./flag-dialog";
import {
  deleteFeatureFlag,
  updateFeatureFlag,
  getAgencyOverridesForFlag,
} from "@/lib/actions/admin/config";
import type { FeatureFlagRow, AgencyOverrideRow } from "@/lib/actions/admin/config";

interface FlagsTableProps {
  data: FeatureFlagRow[];
}

export function FlagsTable({ data }: FlagsTableProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<FeatureFlagRow | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<FeatureFlagRow | null>(null);

  // Expanded row for agency overrides
  const [expandedFlagId, setExpandedFlagId] = useState<string | null>(null);
  const [overrides, setOverrides] = useState<AgencyOverrideRow[]>([]);
  const [loadingOverrides, setLoadingOverrides] = useState(false);

  function toggleEnabled(flag: FeatureFlagRow) {
    startTransition(async () => {
      await updateFeatureFlag(flag.id, {
        name: flag.name,
        description: flag.description ?? undefined,
        enabled: !flag.enabled,
        rolloutPercent: flag.rolloutPercent,
      });
      router.refresh();
    });
  }

  function handleDelete() {
    if (!deleteTarget) return;
    const id = deleteTarget.id;
    startTransition(async () => {
      await deleteFeatureFlag(id);
      setDeleteTarget(null);
      router.refresh();
    });
  }

  async function toggleExpand(flagId: string) {
    if (expandedFlagId === flagId) {
      setExpandedFlagId(null);
      setOverrides([]);
      return;
    }
    setExpandedFlagId(flagId);
    setLoadingOverrides(true);
    const result = await getAgencyOverridesForFlag(flagId);
    setOverrides(result.success ? result.data : []);
    setLoadingOverrides(false);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {data.length} {data.length === 1 ? "flag" : "flags"} cadastradas
        </p>
        <Button size="sm" onClick={() => setCreateOpen(true)}>
          <Plus className="h-4 w-4 mr-1" />
          Nova flag
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-8" />
              <TableHead>Chave</TableHead>
              <TableHead>Nome</TableHead>
              <TableHead>Habilitada</TableHead>
              <TableHead>Rollout</TableHead>
              <TableHead>Overrides</TableHead>
              <TableHead>Atualizado por</TableHead>
              <TableHead className="w-20" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="h-32 text-center text-muted-foreground">
                  Nenhuma feature flag cadastrada.
                </TableCell>
              </TableRow>
            ) : (
              data.map((row) => (
                <Fragment key={row.id}>
                  <TableRow>
                    {/* Expand button */}
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => toggleExpand(row.id)}
                        title="Ver overrides por agência"
                      >
                        {expandedFlagId === row.id ? (
                          <ChevronDown className="h-3.5 w-3.5" />
                        ) : (
                          <ChevronRight className="h-3.5 w-3.5" />
                        )}
                      </Button>
                    </TableCell>
                    <TableCell className="font-mono text-xs font-medium">{row.key}</TableCell>
                    <TableCell className="text-sm">
                      <div>
                        <p className="font-medium">{row.name}</p>
                        {row.description && (
                          <p className="text-xs text-muted-foreground truncate max-w-[180px]">
                            {row.description}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Switch
                        checked={row.enabled}
                        onCheckedChange={() => toggleEnabled(row)}
                        disabled={isPending}
                      />
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">{row.rolloutPercent}%</span>
                    </TableCell>
                    <TableCell>
                      {row.overrideCount > 0 ? (
                        <Badge variant="secondary" className="text-xs">
                          {row.overrideCount}
                        </Badge>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {row.updatedByName ?? "—"}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          title="Histórico"
                          asChild
                        >
                          <Link href={`/admin/logs?entityType=FEATURE_FLAG&search=${encodeURIComponent(row.key)}`}>
                            <History className="h-3.5 w-3.5" />
                          </Link>
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => setEditTarget(row)}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-destructive hover:text-destructive"
                          onClick={() => setDeleteTarget(row)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>

                  {/* Agency overrides panel */}
                  {expandedFlagId === row.id && (
                    <TableRow className="bg-muted/30">
                      <TableCell colSpan={8} className="py-3 px-6">
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                              <Building2 className="h-3.5 w-3.5" />
                              Overrides por agência
                            </p>
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 text-xs"
                              disabled
                              title="Em breve"
                            >
                              + Add override
                            </Button>
                          </div>

                          {loadingOverrides ? (
                            <p className="text-xs text-muted-foreground">Carregando...</p>
                          ) : overrides.length === 0 ? (
                            <p className="text-xs text-muted-foreground italic">
                              Nenhum override configurado para esta flag.
                            </p>
                          ) : (
                            <div className="rounded border bg-background overflow-hidden">
                              <Table>
                                <TableHeader>
                                  <TableRow>
                                    <TableHead className="text-xs h-8">Agência</TableHead>
                                    <TableHead className="text-xs h-8">Override</TableHead>
                                    <TableHead className="text-xs h-8">Atualizado em</TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {overrides.map((ov) => (
                                    <TableRow key={ov.id}>
                                      <TableCell className="text-xs py-2">{ov.agencyName}</TableCell>
                                      <TableCell className="py-2">
                                        <Badge
                                          className={`text-xs ${
                                            ov.enabled
                                              ? "bg-green-100 text-green-800"
                                              : "bg-red-100 text-red-800"
                                          }`}
                                          variant="outline"
                                        >
                                          {ov.enabled ? "Habilitado" : "Desabilitado"}
                                        </Badge>
                                      </TableCell>
                                      <TableCell className="text-xs text-muted-foreground py-2">
                                        {ov.updatedAt.toLocaleDateString("pt-BR")}
                                      </TableCell>
                                    </TableRow>
                                  ))}
                                </TableBody>
                              </Table>
                            </div>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </Fragment>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Create dialog */}
      <FlagDialog open={createOpen} onOpenChange={setCreateOpen} />

      {/* Edit dialog */}
      {editTarget && (
        <FlagDialog
          open={!!editTarget}
          onOpenChange={(open) => { if (!open) setEditTarget(null); }}
          existing={editTarget}
        />
      )}

      {/* Delete confirmation */}
      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Deletar feature flag</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja deletar a flag{" "}
              <span className="font-mono font-semibold">{deleteTarget?.key}</span>?
              Todos os overrides por agência também serão removidos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive hover:bg-destructive/90"
              onClick={handleDelete}
              disabled={isPending}
            >
              {isPending ? "Deletando..." : "Deletar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
