import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { AgencySidebar } from "@/components/shared/agency-sidebar";
import { getActiveContextFromDB } from "@/lib/active-context";

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
    // Normal agency user — allow through
  } else if (role === "SUPER_ADMIN") {
    const { scope, agencyId } = await getActiveContextFromDB(session.user.id);
    if (scope !== "agency" || !agencyId) {
      redirect("/admin");
    }
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
