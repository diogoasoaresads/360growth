"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useCallback, useTransition } from "react";
import { Search, X, ChevronDown, Check } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ACTION_CATEGORIES, type ActionCategory } from "@/lib/log-utils";

const ENTITY_TYPES = [
  { value: "CLIENT", label: "Cliente" },
  { value: "DEAL", label: "Deal" },
  { value: "TICKET", label: "Ticket" },
  { value: "CONTACT", label: "Contato" },
  { value: "AGENCY", label: "Agência" },
  { value: "PLAN", label: "Plano" },
  { value: "USER", label: "Usuário" },
  { value: "PLATFORM_SETTING", label: "Config. Plataforma" },
  { value: "FEATURE_FLAG", label: "Feature Flag" },
] as const;

const CATEGORY_BADGE_CLASSES: Record<string, string> = {
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

interface LogsToolbarProps {
  search: string;
  selectedCategories: string[];
  entityType: string;
  dateFrom: string;
  dateTo: string;
}

export function LogsToolbar({
  search,
  selectedCategories,
  entityType,
  dateFrom,
  dateTo,
}: LogsToolbarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  const updateParam = useCallback(
    (updates: Record<string, string | string[] | null>) => {
      const params = new URLSearchParams(searchParams.toString());
      params.delete("page"); // reset to page 1 on filter change

      for (const [key, value] of Object.entries(updates)) {
        if (value === null || value === "" || (Array.isArray(value) && value.length === 0)) {
          params.delete(key);
        } else if (Array.isArray(value)) {
          params.set(key, value.join(","));
        } else {
          params.set(key, value);
        }
      }

      startTransition(() => {
        router.push(`${pathname}?${params.toString()}`);
      });
    },
    [router, pathname, searchParams]
  );

  function setPreset(preset: "today" | "7d" | "30d" | "month") {
    const now = new Date();
    let from: Date;

    if (preset === "today") {
      from = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    } else if (preset === "7d") {
      from = new Date(now);
      from.setDate(from.getDate() - 7);
    } else if (preset === "30d") {
      from = new Date(now);
      from.setDate(from.getDate() - 30);
    } else {
      from = new Date(now.getFullYear(), now.getMonth(), 1);
    }

    updateParam({
      dateFrom: from.toISOString().split("T")[0],
      dateTo: now.toISOString().split("T")[0],
    });
  }

  function toggleCategory(cat: ActionCategory) {
    const next = selectedCategories.includes(cat)
      ? selectedCategories.filter((c) => c !== cat)
      : [...selectedCategories, cat];
    updateParam({ categories: next.length > 0 ? next : null });
  }

  const hasFilters = search || selectedCategories.length > 0 || entityType || dateFrom || dateTo;

  return (
    <div className="space-y-3">
      {/* Filter row */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar usuário ou recurso..."
            defaultValue={search}
            className="pl-8 w-64"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                updateParam({ search: (e.target as HTMLInputElement).value });
              }
            }}
            onBlur={(e) => {
              if (e.target.value !== search) {
                updateParam({ search: e.target.value });
              }
            }}
          />
        </div>

        {/* Entity type filter */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="gap-1">
              Tipo de entidade
              {entityType && (
                <Badge variant="secondary" className="ml-1 h-4 px-1 text-xs">1</Badge>
              )}
              <ChevronDown className="h-3 w-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-48">
            {ENTITY_TYPES.map((et) => {
              const checked = entityType === et.value;
              return (
                <DropdownMenuItem
                  key={et.value}
                  className="flex items-center gap-2 cursor-pointer"
                  onSelect={(e) => {
                    e.preventDefault();
                    updateParam({ entityType: checked ? null : et.value });
                  }}
                >
                  <Check className={`h-3 w-3 ${checked ? "opacity-100" : "opacity-0"}`} />
                  <span className="text-sm">{et.label}</span>
                </DropdownMenuItem>
              );
            })}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Category filter */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="gap-1">
              Tipo de ação
              {selectedCategories.length > 0 && (
                <Badge variant="secondary" className="ml-1 h-4 px-1 text-xs">
                  {selectedCategories.length}
                </Badge>
              )}
              <ChevronDown className="h-3 w-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-44">
            {(Object.keys(ACTION_CATEGORIES) as ActionCategory[]).map((cat) => {
              const checked = selectedCategories.includes(cat);
              return (
                <DropdownMenuItem
                  key={cat}
                  className="flex items-center gap-2 cursor-pointer"
                  onSelect={(e) => { e.preventDefault(); toggleCategory(cat); }}
                >
                  <Check className={`h-3 w-3 ${checked ? "opacity-100" : "opacity-0"}`} />
                  <span className={`inline-block rounded px-1.5 py-0.5 text-xs ${CATEGORY_BADGE_CLASSES[cat] ?? ""}`}>
                    {ACTION_CATEGORIES[cat].label}
                  </span>
                </DropdownMenuItem>
              );
            })}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Date presets */}
        <div className="flex gap-1">
          {(["today", "7d", "30d", "month"] as const).map((p) => {
            const labels = { today: "Hoje", "7d": "7 dias", "30d": "30 dias", month: "Este mês" };
            return (
              <Button
                key={p}
                variant="outline"
                size="sm"
                className="text-xs"
                onClick={() => setPreset(p)}
              >
                {labels[p]}
              </Button>
            );
          })}
        </div>

        {/* Date range */}
        <Input
          type="date"
          value={dateFrom}
          className="w-36 text-sm"
          onChange={(e) => updateParam({ dateFrom: e.target.value })}
          placeholder="De"
        />
        <Input
          type="date"
          value={dateTo}
          className="w-36 text-sm"
          onChange={(e) => updateParam({ dateTo: e.target.value })}
          placeholder="Até"
        />

        {/* Clear filters */}
        {hasFilters && (
          <Button
            variant="ghost"
            size="sm"
            className="gap-1 text-muted-foreground"
            onClick={() =>
              updateParam({ search: null, categories: null, entityType: null, dateFrom: null, dateTo: null })
            }
          >
            <X className="h-3 w-3" />
            Limpar
          </Button>
        )}
      </div>
    </div>
  );
}
