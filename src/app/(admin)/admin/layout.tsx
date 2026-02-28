import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { db } from "@/lib/db";
import { agencies } from "@/lib/db/schema";
import { eq, asc } from "drizzle-orm";
import { SuperAdminSidebar } from "@/components/shared/super-admin-sidebar";
import { AdminHeader } from "@/components/admin/header";
import { AgencyContextBanner } from "@/components/admin/agency-context-banner";
import { SCOPE_COOKIE, AGENCY_ID_COOKIE } from "@/lib/actions/admin/context";
import type { ActiveScope } from "@/lib/actions/admin/context";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session || session.user.role !== "SUPER_ADMIN") {
    redirect("/unauthorized");
  }

  const store = await cookies();
  const scope = (store.get(SCOPE_COOKIE)?.value ?? "platform") as ActiveScope;
  const agencyId = store.get(AGENCY_ID_COOKIE)?.value ?? null;

  const agenciesList = await db
    .select({ id: agencies.id, name: agencies.name })
    .from(agencies)
    .orderBy(asc(agencies.name));

  let activeAgencyName: string | null = null;
  if (scope === "agency" && agencyId) {
    const [ag] = await db
      .select({ name: agencies.name })
      .from(agencies)
      .where(eq(agencies.id, agencyId));
    activeAgencyName = ag?.name ?? null;
    if (!activeAgencyName) {
      console.warn(
        `[admin/layout] activeAgencyId=${agencyId} not found, falling back to platform`
      );
    }
  }

  const resolvedScope: ActiveScope =
    scope === "agency" && activeAgencyName ? "agency" : "platform";

  return (
    <div className="flex h-screen overflow-hidden">
      <SuperAdminSidebar activeScope={resolvedScope} />
      <div className="flex flex-1 flex-col overflow-hidden">
        <AdminHeader
          agencies={agenciesList}
          activeScope={resolvedScope}
          activeAgencyId={resolvedScope === "agency" ? agencyId : null}
          activeAgencyName={activeAgencyName}
        />
        {resolvedScope === "agency" && activeAgencyName && (
          <AgencyContextBanner agencyName={activeAgencyName} />
        )}
        <main className="flex-1 overflow-auto p-6 bg-muted/30">{children}</main>
      </div>
    </div>
  );
}
