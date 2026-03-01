import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getMigrationStatus } from "@/lib/actions/admin/db-migrate";
import { DbMigrateClient } from "./db-migrate-client";

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
    <div className="flex-1 space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">DB Migrations</h1>
        <p className="text-muted-foreground mt-1">
          Aplicar migrations Drizzle pendentes no banco de produção.
          Somente acessível para SUPER_ADMIN.
        </p>
      </div>
      <DbMigrateClient status={status} />
    </div>
  );
}
