import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { integrationJobs, agencies } from "@/lib/db/schema";
import { desc, sql } from "drizzle-orm";
import { JobsClient } from "./jobs-client";

export const metadata: Metadata = {
  title: "Jobs de Integração",
};

export default async function IntegrationJobsPage() {
  const session = await auth();
  if (!session || session.user.role !== "SUPER_ADMIN") {
    redirect("/admin");
  }

  // Last 100 jobs, joined with agency name for context
  const rows = await db
    .select({
      id: integrationJobs.id,
      integrationId: integrationJobs.integrationId,
      ownerScope: integrationJobs.ownerScope,
      ownerId: integrationJobs.ownerId,
      provider: integrationJobs.provider,
      type: integrationJobs.type,
      status: integrationJobs.status,
      attempts: integrationJobs.attempts,
      maxAttempts: integrationJobs.maxAttempts,
      lastError: integrationJobs.lastError,
      meta: integrationJobs.meta,
      startedAt: integrationJobs.startedAt,
      finishedAt: integrationJobs.finishedAt,
      createdAt: integrationJobs.createdAt,
      updatedAt: integrationJobs.updatedAt,
      agencyName: agencies.name,
    })
    .from(integrationJobs)
    .leftJoin(
      agencies,
      sql`${integrationJobs.ownerScope} = 'agency' AND ${integrationJobs.ownerId} = ${agencies.id}`
    )
    .orderBy(desc(integrationJobs.createdAt))
    .limit(100);

  const providers = Array.from(new Set(rows.map((r) => r.provider))).sort();

  return (
    <div className="flex-1 space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Jobs de Integração
        </h1>
        <p className="text-sm text-muted-foreground">
          Histórico de execuções do Integration Engine. Últimos 100 jobs de
          todas as agências.
        </p>
      </div>

      <JobsClient jobs={rows} providers={providers} />
    </div>
  );
}
