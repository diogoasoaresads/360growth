import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { agencies } from "@/lib/db/schema";
import { asc } from "drizzle-orm";
import { SuperAdminSidebar } from "@/components/shared/super-admin-sidebar";
import { AdminHeader } from "@/components/admin/header";
import { AgencyContextBanner } from "@/components/admin/agency-context-banner";
import { getActiveContextFromDB } from "@/lib/active-context";
import { features } from "@/config/features";
import { navigation } from "@/config/navigation";
import { WorkspaceShell } from "@/components/workspace/WorkspaceShell";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session || session.user.role !== "SUPER_ADMIN") {
    redirect("/unauthorized");
  }

  // Source of truth: user_contexts table (auto-resets if agency was deleted)
  const { scope, agencyId, agencyName } = await getActiveContextFromDB(
    session.user.id
  );

  // Fetch all agencies for the context switcher dropdown
  const agenciesList = await db
    .select({ id: agencies.id, name: agencies.name })
    .from(agencies)
    .orderBy(asc(agencies.name));

  // ── Unified Workspace Shell (feature-flagged, PO only) ─────────────────────
  if (features.useUnifiedShell) {
    return (
      <WorkspaceShell
        navGroups={navigation.platform}
        scope={scope}
        agencies={agenciesList}
        activeAgencyId={agencyId}
        activeAgencyName={agencyName}
      >
        {children}
      </WorkspaceShell>
    );
  }

  // ── Legacy layout (fallback) ───────────────────────────────────────────────
  return (
    <div className="flex h-screen overflow-hidden">
      <SuperAdminSidebar activeScope={scope} />
      <div className="flex flex-1 flex-col overflow-hidden">
        <AdminHeader
          agencies={agenciesList}
          activeScope={scope}
          activeAgencyId={agencyId}
          activeAgencyName={agencyName}
        />
        {scope === "agency" && agencyName && (
          <AgencyContextBanner agencyName={agencyName} />
        )}
        <main className="flex-1 overflow-auto p-6 bg-muted/30">{children}</main>
      </div>
    </div>
  );
}

