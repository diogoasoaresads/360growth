import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getMigrationStatus } from "@/lib/actions/admin/db-migrate";
import { DbMigrateClient } from "./db-migrate-client";
import { PageContainer } from "@/components/workspace/PageContainer";

export const metadata: Metadata = {
  title: "DB Migrations | Sistema",
};

export default async function DbMigratePage() {
  const session = await auth();
  if (!session || session.user.role !== "SUPER_ADMIN") {
    redirect("/admin");
  }

  const status = await getMigrationStatus();

  return (
    <PageContainer
      title="DB Migrations"
      description="Aplicar migrations Drizzle pendentes no banco de produção. Somente acessível para SUPER_ADMIN."
    >
      <DbMigrateClient status={status} />
    </PageContainer>
  );
}
