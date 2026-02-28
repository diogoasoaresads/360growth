import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { PortalSidebar } from "@/components/shared/portal-sidebar";
import { db } from "@/lib/db";
import { agencies } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export default async function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session || session.user.role !== "CLIENT") {
    redirect("/login");
  }

  // Block portal access when agency is blocked
  const agencyId = session.user.agencyId;
  if (agencyId) {
    const [agencyRow] = await db
      .select({ agencyStatus: agencies.agencyStatus })
      .from(agencies)
      .where(eq(agencies.id, agencyId));
    if (agencyRow?.agencyStatus === "blocked") {
      redirect("/unauthorized");
    }
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <PortalSidebar />
      <main className="flex-1 overflow-y-auto bg-background">
        {children}
      </main>
    </div>
  );
}
