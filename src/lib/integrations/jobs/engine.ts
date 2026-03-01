/**
 * src/lib/integrations/jobs/engine.ts
 *
 * Pure utilities for the Integration Job Engine.
 * No "use server" — safe to import from server actions, API routes and tests.
 */

import type { IntegrationJob } from "@/lib/db/schema";

/** Handler contract every provider+type pair must satisfy. */
export type JobHandler = (ctx: {
  integrationId: string;
  provider: string;
  type: string;
  agencyId: string;
  apiKey?: string;
}) => Promise<{ ok: boolean; message?: string }>;

/**
 * Returns false if there is already a *running* job for the same integrationId,
 * preventing concurrent executions.
 */
export function canStartJob(runningJobs: Pick<IntegrationJob, "status">[]): boolean {
  return !runningJobs.some((j) => j.status === "running");
}

/**
 * Duration in milliseconds between two timestamps.
 * Returns 0 if either value is null.
 */
export function computeDurationMs(
  startedAt: Date | null,
  finishedAt: Date | null
): number {
  if (!startedAt || !finishedAt) return 0;
  return Math.max(0, finishedAt.getTime() - startedAt.getTime());
}

/** Format a duration in ms to a human-readable string (e.g. "1.2s", "320ms"). */
export function formatDuration(ms: number): string {
  if (ms >= 1000) return `${(ms / 1000).toFixed(1)}s`;
  return `${ms}ms`;
}

/**
 * Normalises any caught error into a safe string:
 * – strips known secret patterns
 * – truncates to 2 000 chars
 * – never logs the raw value
 */
export function normalizeJobError(err: unknown): string {
  const MAX = 2000;
  let msg: string;
  if (err instanceof Error) {
    msg = err.message;
  } else if (typeof err === "string") {
    msg = err;
  } else {
    msg = "Erro desconhecido";
  }
  // Redact obvious secret patterns
  msg = msg.replace(/\$aact_[^\s"',]*/gi, "[REDACTED]");
  msg = msg.replace(/access_token[^&\s"',]*/gi, "[REDACTED]");
  return msg.slice(0, MAX);
}
