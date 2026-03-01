/**
 * Feature flags — toggled per-environment without touching route logic.
 * All flags are pure booleans; no external service required.
 */
export const features = {
  /**
   * Enables the Unified Workspace Shell (grouped sidebar + modern topbar)
   * for the PO (platform / SUPER_ADMIN) scope.
   * Agency and Client scopes are not affected until PACOTE 2 / 3.
   */
  useUnifiedShell: true,
} as const;
