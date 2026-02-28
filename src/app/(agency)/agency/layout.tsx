import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { AgencySidebar } from "@/components/shared/agency-sidebar";
import { getActiveContextFromDB } from "@/lib/active-context";
import { db } from "@/lib/db";
import { agencies } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

async function getAgencyStatus(agencyId: string) {
  const [row] = await db
    .select({ agencyStatus: agencies.agencyStatus })
    .from(agencies)
    .where(eq(agencies.id, agencyId));
  return row?.agencyStatus ?? null;
}

export default async function AgencyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session) {
    redirect("/login");
  }

  const { role } = session.user;

  if (role === "AGENCY_ADMIN" || role === "AGENCY_MEMBER") {
    // Normal agency user — check blocked status
    const agencyId = session.user.agencyId;
    if (agencyId) {
      const status = await getAgencyStatus(agencyId);
      if (status === "blocked") redirect("/unauthorized");
    }
  } else if (role === "SUPER_ADMIN") {
    const { scope, agencyId } = await getActiveContextFromDB(session.user.id);
    if (scope !== "agency" || !agencyId) {
      redirect("/admin");
    }
    // SUPER_ADMIN always allowed even if agency is blocked
  } else {
    redirect("/unauthorized");
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <AgencySidebar />
      <main className="flex-1 overflow-y-auto bg-background">
        {children}
      </main>
    </div>
  );
}
