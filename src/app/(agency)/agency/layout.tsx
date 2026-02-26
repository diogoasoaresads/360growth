import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { AgencySidebar } from "@/components/shared/agency-sidebar";

export default async function AgencyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (
    !session ||
    (session.user.role !== "AGENCY_ADMIN" && session.user.role !== "AGENCY_MEMBER")
  ) {
    redirect("/login");
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
