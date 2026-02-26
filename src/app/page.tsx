import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function HomePage() {
  const session = await auth();

  if (!session) {
    redirect("/login");
  }

  switch (session.user.role) {
    case "SUPER_ADMIN":
      redirect("/super-admin/dashboard");
    case "AGENCY_ADMIN":
    case "AGENCY_MEMBER":
      redirect("/agency/dashboard");
    case "CLIENT":
      redirect("/portal/dashboard");
    default:
      redirect("/login");
  }
}
