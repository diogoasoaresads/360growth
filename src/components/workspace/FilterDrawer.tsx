"use client";

import type { ReactNode } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
  SheetClose,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { SlidersHorizontal } from "lucide-react";
import { useState } from "react";

// ─── Types ───────────────────────────────────────────────────────────────────

interface FilterDrawerProps {
  title?: string;
  children: ReactNode;
  onApply?: () => void;
  onClear?: () => void;
  /** Show a badge count on the trigger button. */
  activeCount?: number;
}

// ─── Component ───────────────────────────────────────────────────────────────

export function FilterDrawer({
  title = "Filtros",
  children,
  onApply,
  onClear,
  activeCount = 0,
}: FilterDrawerProps) {
  const [open, setOpen] = useState(false);

  function handleApply() {
    onApply?.();
    setOpen(false);
  }

  function handleClear() {
    onClear?.();
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      {/* Trigger */}
      <Button
        variant="outline"
        size="sm"
        onClick={() => setOpen(true)}
        className="gap-1.5 h-9"
      >
        <SlidersHorizontal className="h-3.5 w-3.5" />
        Filtros
        {activeCount > 0 && (
          <span className="ml-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-medium text-primary-foreground">
            {activeCount}
          </span>
        )}
      </Button>

      <SheetContent side="right" className="w-80 sm:w-96">
        <SheetHeader>
          <SheetTitle>{title}</SheetTitle>
        </SheetHeader>

        {/* Filter inputs */}
        <div className="flex flex-col gap-4 py-6">{children}</div>

        <SheetFooter className="flex-row gap-2">
          {onClear && (
            <Button
              variant="ghost"
              size="sm"
              className="flex-1"
              onClick={handleClear}
            >
              Limpar
            </Button>
          )}
          <SheetClose asChild>
            <Button size="sm" className="flex-1" onClick={handleApply}>
              Aplicar
            </Button>
          </SheetClose>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
