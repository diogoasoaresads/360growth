"use client";

import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  RowSelectionState,
} from "@tanstack/react-table";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { DataTablePagination } from "./data-table-pagination";
import { DataTableToolbar, FacetedFilterConfig } from "./data-table-toolbar";
import { EmptyState } from "@/components/admin/empty-state";
import { Inbox } from "lucide-react";

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  totalCount: number;
  isLoading?: boolean;
  searchPlaceholder?: string;
  facetedFilters?: FacetedFilterConfig<TData>[];
  bulkActions?: (selectedRows: TData[]) => React.ReactNode;
  enableRowSelection?: boolean;
  emptyState?: {
    title: string;
    description?: string;
    action?: { label: string; onClick: () => void };
  };
}

/** Helper: read a number URL param, fallback to default */
function useUrlPaginationState(defaultPage = 1, defaultPerPage = 25) {
  const searchParams = useSearchParams();
  const page = Math.max(1, Number(searchParams.get("page") ?? defaultPage));
  const perPage = Number(searchParams.get("perPage") ?? defaultPerPage);
  const validPerPage = [10, 25, 50].includes(perPage) ? perPage : defaultPerPage;
  return { page, perPage: validPerPage };
}

function useUrlSortState() {
  const searchParams = useSearchParams();
  const sort = searchParams.get("sort");
  const order = searchParams.get("order");
  if (!sort) return [] as SortingState;
  return [{ id: sort, desc: order === "desc" }] as SortingState;
}

export function DataTable<TData, TValue>({
  columns,
  data,
  totalCount,
  isLoading = false,
  searchPlaceholder,
  facetedFilters = [],
  bulkActions,
  enableRowSelection = true,
  emptyState = { title: "Nenhum resultado encontrado" },
}: DataTableProps<TData, TValue>) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const { page, perPage } = useUrlPaginationState();
  const initialSorting = useUrlSortState();

  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [sorting, setSorting] = useState<SortingState>(initialSorting);

  // Sync sorting → URL
  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString());
    if (sorting.length > 0) {
      params.set("sort", sorting[0].id);
      params.set("order", sorting[0].desc ? "desc" : "asc");
    } else {
      params.delete("sort");
      params.delete("order");
    }
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sorting]);

  // Prepend selection column if enabled
  const allColumns: ColumnDef<TData, TValue>[] = enableRowSelection
    ? [
        {
          id: "select",
          header: ({ table }) => (
            <Checkbox
              checked={
                table.getIsAllPageRowsSelected()
                  ? true
                  : table.getIsSomePageRowsSelected()
                  ? "indeterminate"
                  : false
              }
              onCheckedChange={(value) =>
                table.toggleAllPageRowsSelected(!!value)
              }
              aria-label="Selecionar tudo"
            />
          ),
          cell: ({ row }) => (
            <Checkbox
              checked={row.getIsSelected()}
              onCheckedChange={(value) => row.toggleSelected(!!value)}
              aria-label="Selecionar linha"
            />
          ),
          enableSorting: false,
          enableHiding: false,
          size: 40,
        } as ColumnDef<TData, TValue>,
        ...columns,
      ]
    : columns;

  const table = useReactTable({
    data,
    columns: allColumns,
    state: {
      sorting,
      columnVisibility,
      rowSelection,
      columnFilters,
      pagination: {
        pageIndex: page - 1,
        pageSize: perPage,
      },
    },
    pageCount: Math.ceil(totalCount / perPage),
    manualPagination: true,
    manualSorting: true,
    enableRowSelection,
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onPaginationChange: (updater) => {
      const current = { pageIndex: page - 1, pageSize: perPage };
      const next =
        typeof updater === "function" ? updater(current) : updater;
      const params = new URLSearchParams(searchParams.toString());
      params.set("page", String(next.pageIndex + 1));
      params.set("perPage", String(next.pageSize));
      router.push(`${pathname}?${params.toString()}`);
    },
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
  });

  const selectedRows = table
    .getFilteredSelectedRowModel()
    .rows.map((r) => r.original);

  return (
    <div className="space-y-2">
      <DataTableToolbar
        table={table}
        searchPlaceholder={searchPlaceholder}
        facetedFilters={facetedFilters}
        bulkActions={bulkActions ? bulkActions(selectedRows) : undefined}
      />

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    colSpan={header.colSpan}
                    style={{ width: header.getSize() !== 150 ? header.getSize() : undefined }}
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>

          <TableBody>
            {isLoading ? (
              // Loading skeleton rows
              Array.from({ length: perPage > 10 ? 10 : perPage }).map((_, i) => (
                <TableRow key={i}>
                  {allColumns.map((_, j) => (
                    <TableCell key={j}>
                      <Skeleton className="h-5 w-full" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={allColumns.length}
                  className="h-64 text-center"
                >
                  <EmptyState
                    icon={Inbox}
                    title={emptyState.title}
                    description={emptyState.description}
                    action={emptyState.action}
                  />
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <DataTablePagination table={table} totalCount={totalCount} />
    </div>
  );
}
