import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { PortalSidebar } from "@/components/shared/portal-sidebar";
import { db } from "@/lib/db";
import { clients, agencies, userContexts } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export default async function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session) {
    redirect("/login");
  }

  const { role } = session.user;

  // SUPER_ADMIN in client-mode: validate scope=client + clientId from user_contexts
  if (role === "SUPER_ADMIN") {
    const [ctx] = await db
      .select({
        activeScope: userContexts.activeScope,
        activeClientId: userContexts.activeClientId,
      })
      .from(userContexts)
      .where(eq(userContexts.userId, session.user.id))
      .limit(1);

    if (ctx?.activeScope !== "client" || !ctx?.activeClientId) {
      redirect("/admin");
    }

    return (
      <div className="flex h-screen overflow-hidden">
        <PortalSidebar />
        <main className="flex-1 overflow-y-auto bg-background">{children}</main>
      </div>
    );
  }

  if (role !== "CLIENT") {
    redirect("/login");
  }

  // Block portal access when agency is blocked.
  // CLIENT users don't have agencyId in session — derive it from the clients table.
  const clientRecord = await db.query.clients.findFirst({
    where: eq(clients.userId, session.user.id),
    columns: { agencyId: true },
  });

  if (clientRecord?.agencyId) {
    const [agencyRow] = await db
      .select({ agencyStatus: agencies.agencyStatus })
      .from(agencies)
      .where(eq(agencies.id, clientRecord.agencyId));
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
