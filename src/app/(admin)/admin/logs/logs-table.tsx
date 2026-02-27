"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
} from "@tanstack/react-table";
import { ChevronUp, ChevronDown } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { AuditLogEntry } from "@/lib/actions/admin/logs";
import { columns } from "./columns";

interface LogsTableProps {
  data: AuditLogEntry[];
  totalCount: number;
  page: number;
  perPage: number;
  totalPages: number;
  sortOrder: "asc" | "desc";
}

export function LogsTable({
  data,
  totalCount,
  page,
  perPage,
  totalPages,
  sortOrder,
}: LogsTableProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function updateParam(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set(key, value);
    params.delete("page"); // reset to page 1 when changing perPage
    router.push(`${pathname}?${params.toString()}`);
  }

  function setPage(p: number) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", String(p));
    router.push(`${pathname}?${params.toString()}`);
  }

  function toggleSort() {
    updateParam("order", sortOrder === "desc" ? "asc" : "desc");
  }

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    pageCount: totalPages,
  });

  const from = Math.min((page - 1) * perPage + 1, totalCount);
  const to = Math.min(page * perPage, totalCount);

  return (
    <div className="space-y-2">
      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              {/* Timestamp with sort toggle */}
              <TableHead className="cursor-pointer whitespace-nowrap" onClick={toggleSort}>
                <div className="flex items-center gap-1">
                  Timestamp
                  {sortOrder === "desc" ? (
                    <ChevronDown className="h-3 w-3" />
                  ) : (
                    <ChevronUp className="h-3 w-3" />
                  )}
                </div>
              </TableHead>
              <TableHead>Usuário</TableHead>
              <TableHead>Ação</TableHead>
              <TableHead>Recurso</TableHead>
              <TableHead>IP</TableHead>
              <TableHead>Detalhes</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                  Nenhum log encontrado.
                </TableCell>
              </TableRow>
            ) : (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className="align-top py-3">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between px-2 text-sm text-muted-foreground">
        <p>
          {totalCount === 0
            ? "Nenhum resultado"
            : `Exibindo ${from}–${to} de ${totalCount.toLocaleString("pt-BR")} registros`}
        </p>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            <span>Linhas:</span>
            <Select
              value={String(perPage)}
              onValueChange={(v) => updateParam("perPage", v)}
            >
              <SelectTrigger className="h-7 w-16 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="25">25</SelectItem>
                <SelectItem value="50">50</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              className="h-7 px-2 text-xs"
              disabled={page <= 1}
              onClick={() => setPage(page - 1)}
            >
              ‹ Anterior
            </Button>
            <span className="px-2">
              {page} / {totalPages || 1}
            </span>
            <Button
              variant="outline"
              size="sm"
              className="h-7 px-2 text-xs"
              disabled={page >= totalPages}
              onClick={() => setPage(page + 1)}
            >
              Próxima ›
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
