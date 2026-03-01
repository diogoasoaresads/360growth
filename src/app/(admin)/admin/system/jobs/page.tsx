import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { integrationJobs, agencies } from "@/lib/db/schema";
import { desc, sql } from "drizzle-orm";
import { JobsClient } from "./jobs-client";
import { PageContainer } from "@/components/workspace/PageContainer";

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
    <PageContainer
      title="Jobs de Integração"
      description="Histórico de execuções do Integration Engine. Últimos 100 jobs de todas as agências."
    >
      <JobsClient jobs={rows} providers={providers} />
    </PageContainer>
  );
}
