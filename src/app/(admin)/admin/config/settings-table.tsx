"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, Pencil, Trash2, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import { SettingDialog } from "./setting-dialog";
import { deletePlatformSetting } from "@/lib/actions/admin/config";
import type { PlatformSettingRow } from "@/lib/actions/admin/config";

const TYPE_BADGE: Record<string, string> = {
  string: "bg-blue-100 text-blue-800",
  number: "bg-amber-100 text-amber-800",
  boolean: "bg-green-100 text-green-800",
  json: "bg-purple-100 text-purple-800",
};

interface SettingsTableProps {
  data: PlatformSettingRow[];
}

export function SettingsTable({ data }: SettingsTableProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<PlatformSettingRow | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<PlatformSettingRow | null>(null);
  const [revealed, setRevealed] = useState<Set<string>>(new Set());

  function toggleReveal(key: string) {
    setRevealed((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  function handleDelete() {
    if (!deleteTarget) return;
    const key = deleteTarget.key;
    startTransition(async () => {
      await deletePlatformSetting(key);
      setDeleteTarget(null);
      router.refresh();
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {data.length} {data.length === 1 ? "configuração" : "configurações"} cadastradas
        </p>
        <Button size="sm" onClick={() => setCreateOpen(true)}>
          <Plus className="h-4 w-4 mr-1" />
          Nova configuração
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Chave</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Valor</TableHead>
              <TableHead>Descrição</TableHead>
              <TableHead>Atualizado por</TableHead>
              <TableHead className="w-20" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                  Nenhuma configuração cadastrada.
                </TableCell>
              </TableRow>
            ) : (
              data.map((row) => (
                <TableRow key={row.key}>
                  <TableCell className="font-mono text-xs font-medium">{row.key}</TableCell>
                  <TableCell>
                    <span
                      className={`inline-flex rounded px-2 py-0.5 text-xs font-medium ${
                        TYPE_BADGE[row.type] ?? "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {row.type}
                    </span>
                  </TableCell>
                  <TableCell className="max-w-xs">
                    {row.isSecret ? (
                      <div className="flex items-center gap-1">
                        <span className="font-mono text-xs">
                          {revealed.has(row.key) ? row.value : "•••••"}
                        </span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-5 w-5"
                          onClick={() => toggleReveal(row.key)}
                          title={revealed.has(row.key) ? "Ocultar" : "Revelar"}
                        >
                          {revealed.has(row.key) ? (
                            <EyeOff className="h-3 w-3" />
                          ) : (
                            <Eye className="h-3 w-3" />
                          )}
                        </Button>
                      </div>
                    ) : (
                      <span className="font-mono text-xs truncate block max-w-[200px]">
                        {row.value || <span className="italic text-muted-foreground">(vazio)</span>}
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate">
                    {row.description ?? "—"}
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
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Create dialog */}
      <SettingDialog open={createOpen} onOpenChange={setCreateOpen} />

      {/* Edit dialog */}
      {editTarget && (
        <SettingDialog
          open={!!editTarget}
          onOpenChange={(open) => { if (!open) setEditTarget(null); }}
          existing={editTarget}
        />
      )}

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Deletar configuração</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja deletar a configuração{" "}
              <span className="font-mono font-semibold">{deleteTarget?.key}</span>?
              Esta ação não pode ser desfeita.
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
