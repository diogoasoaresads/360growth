import type { ReactNode } from "react";
import { features } from "@/config/features";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface PageContainerProps {
  title: string;
  description?: string;
  /** Right-side actions — buttons, links, menus. ReactNode so server components
   *  can pass plain <Link>/<Button> without needing "use client". */
  actions?: ReactNode;
  /** Optional slot rendered below the title row (search bars, tabs, etc.). */
  toolbar?: ReactNode;
  children: ReactNode;
}

// ─── Component ───────────────────────────────────────────────────────────────

/**
 * Universal page wrapper — server-component safe (no hooks).
 *
 * When `features.usePagePatternEverywhere` is true:
 *   Renders a standardised heading + optional action row + content area.
 * When false:
 *   Transparent pass-through so pages look exactly as before (rollback).
 */
export function PageContainer({
  title,
  description,
  actions,
  toolbar,
  children,
}: PageContainerProps) {
  if (!features.usePagePatternEverywhere) {
    // Instant rollback — render exactly as old code did
    return <>{children}</>;
  }

  return (
    <div className="flex flex-col gap-6">
      {/* ── Header row ───────────────────────────────────────────── */}
      <div className="flex flex-col gap-4 border-b border-border pb-5">
        <div className="flex items-start justify-between gap-4">
          {/* Title + description */}
          <div className="space-y-1">
            <h1 className="text-2xl font-bold tracking-tight leading-none">
              {title}
            </h1>
            {description && (
              <p className="text-sm text-muted-foreground">{description}</p>
            )}
          </div>

          {/* Actions slot */}
          {actions && (
            <div className="flex shrink-0 items-center gap-2">{actions}</div>
          )}
        </div>

        {/* Toolbar slot (search, filters, tabs …) */}
        {toolbar && <div className="flex items-center gap-3">{toolbar}</div>}
      </div>

      {/* ── Page content ─────────────────────────────────────────── */}
      {children}
    </div>
  );
}
