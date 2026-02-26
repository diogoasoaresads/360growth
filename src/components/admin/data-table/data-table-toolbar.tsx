"use client";

import { Table } from "@tanstack/react-table";
import { X } from "lucide-react";
import { useCallback, useEffect, useRef } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { FacetedFilterOption, DataTableFacetedFilter } from "./data-table-faceted-filter";

export interface FacetedFilterConfig<TData> {
  columnId: string;
  title: string;
  options: FacetedFilterOption[];
}

interface DataTableToolbarProps<TData> {
  table: Table<TData>;
  searchPlaceholder?: string;
  facetedFilters?: FacetedFilterConfig<TData>[];
  bulkActions?: React.ReactNode;
}

export function DataTableToolbar<TData>({
  table,
  searchPlaceholder = "Buscar...",
  facetedFilters = [],
  bulkActions,
}: DataTableToolbarProps<TData>) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isFiltered =
    table.getState().columnFilters.length > 0 ||
    !!searchParams.get("search");

  const selectedCount = table.getFilteredSelectedRowModel().rows.length;

  // Sync URL search param → table global filter on mount
  useEffect(() => {
    const search = searchParams.get("search") ?? "";
    table.setGlobalFilter(search);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSearch = useCallback(
    (value: string) => {
      table.setGlobalFilter(value);
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        const params = new URLSearchParams(searchParams.toString());
        if (value) {
          params.set("search", value);
        } else {
          params.delete("search");
        }
        params.set("page", "1");
        router.push(`${pathname}?${params.toString()}`);
      }, 300);
    },
    [pathname, router, searchParams, table]
  );

  function clearFilters() {
    table.resetColumnFilters();
    table.setGlobalFilter("");
    const params = new URLSearchParams(searchParams.toString());
    params.delete("search");
    params.set("page", "1");
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <div className="flex items-center justify-between gap-2 pb-4">
      <div className="flex flex-1 items-center gap-2 flex-wrap">
        {/* Search */}
        <Input
          placeholder={searchPlaceholder}
          value={(table.getState().globalFilter as string) ?? ""}
          onChange={(e) => handleSearch(e.target.value)}
          className="h-8 w-[200px] lg:w-[280px]"
        />

        {/* Faceted filters */}
        {facetedFilters.map((filter) => {
          const column = table.getColumn(filter.columnId);
          if (!column) return null;
          return (
            <DataTableFacetedFilter
              key={filter.columnId}
              column={column}
              title={filter.title}
              options={filter.options}
            />
          );
        })}

        {/* Clear filters */}
        {isFiltered && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearFilters}
            className="h-8 px-2 lg:px-3"
          >
            Limpar
            <X className="ml-2 h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Bulk actions */}
      {selectedCount > 0 && bulkActions && (
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">
            {selectedCount} selecionado{selectedCount !== 1 ? "s" : ""}
          </span>
          {bulkActions}
        </div>
      )}
    </div>
  );
}
