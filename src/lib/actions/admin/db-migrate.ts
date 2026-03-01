"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { createAuditLog } from "@/lib/audit-log";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import path from "path";
import { sql } from "drizzle-orm";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface MigrationStatus {
  applied: string[];
  pending: string[];
}

export interface MigrationRunResult {
  ok: boolean;
  appliedCount: number;
  error?: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function _requireSuperAdmin() {
  const session = await auth();
  if (!session || session.user.role !== "SUPER_ADMIN") {
    throw new Error("Unauthorized");
  }
  return session;
}

async function _getAppliedMigrations(): Promise<string[]> {
  try {
    const rows = await db.execute<{ tag: string }>(
      sql`SELECT hash as tag FROM __drizzle_migrations ORDER BY created_at ASC`
    );
    return rows.rows.map((r) => r.tag);
  } catch {
    // Table may not exist yet (fresh DB)
    return [];
  }
}

// ─── Exported actions (async functions only) ─────────────────────────────────

export async function getMigrationStatus(): Promise<MigrationStatus> {
  await _requireSuperAdmin();

  const journal = await import(
    "../../../../drizzle/migrations/meta/_journal.json"
  );
  const allTags: string[] = journal.entries.map(
    (e: { tag: string }) => e.tag
  );

  const applied = await _getAppliedMigrations();

  // Drizzle stores a hash, not the tag name — fall back to checking by count
  const pending = allTags.slice(applied.length);

  return { applied: allTags.slice(0, applied.length), pending };
}

export async function runMigrations(): Promise<MigrationRunResult> {
  const session = await _requireSuperAdmin();

  const beforeCount = (await _getAppliedMigrations()).length;

  try {
    const migrationsFolder = path.join(
      process.cwd(),
      "drizzle",
      "migrations"
    );

    await migrate(db, { migrationsFolder });

    const afterCount = (await _getAppliedMigrations()).length;
    const appliedCount = afterCount - beforeCount;

    await createAuditLog({
      userId: session.user.id,
      action: "db_migration_run",
      details: { ok: true, appliedCount, beforeCount, afterCount },
    });

    return { ok: true, appliedCount };
  } catch (err) {
    const error = err instanceof Error ? err.message : String(err);

    await createAuditLog({
      userId: session.user.id,
      action: "db_migration_run",
      details: { ok: false, error },
    });

    return { ok: false, appliedCount: 0, error };
  }
}
