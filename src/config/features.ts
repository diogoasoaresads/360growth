/**
 * Feature flags — toggled per-environment without touching route logic.
 * All flags are pure booleans; no external service required.
 */
export const features = {
  /**
   * Enables the Unified Workspace Shell (grouped sidebar + modern topbar)
   * for the PO (platform / SUPER_ADMIN) scope.
   */
  useUnifiedShell: true,

  /**
   * Enables the universal Page Pattern (PageContainer header) across all scopes.
   * Set false for instant rollback to plain page content.
   */
  usePagePatternEverywhere: true,
} as const;
