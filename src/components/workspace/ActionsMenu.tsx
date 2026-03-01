"use client";

import { MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface MenuAction {
  label: string;
  onClick: () => void;
  /** "danger" renders in destructive colour. Default "default". */
  variant?: "default" | "danger";
  disabled?: boolean;
  /** Rendered before the label. */
  icon?: React.ReactNode;
  /** Renders a separator ABOVE this item. */
  separator?: boolean;
}

interface ActionsMenuProps {
  actions: MenuAction[];
  /** Aria label for the trigger button. */
  label?: string;
}

// ─── Component ───────────────────────────────────────────────────────────────

export function ActionsMenu({ actions, label = "Ações" }: ActionsMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          aria-label={label}
        >
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-44">
        {actions.map((action, idx) => (
          <div key={idx}>
            {action.separator && <DropdownMenuSeparator />}
            <DropdownMenuItem
              onClick={action.onClick}
              disabled={action.disabled}
              className={
                action.variant === "danger"
                  ? "text-destructive focus:text-destructive"
                  : undefined
              }
            >
              {action.icon && (
                <span className="mr-2 h-4 w-4 flex items-center">
                  {action.icon}
                </span>
              )}
              {action.label}
            </DropdownMenuItem>
          </div>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
