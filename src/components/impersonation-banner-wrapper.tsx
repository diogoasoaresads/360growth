import { auth } from "@/lib/auth";
import { ImpersonationBanner } from "./impersonation-banner";

export async function ImpersonationBannerWrapper() {
  const session = await auth();
  if (!session?.user.isImpersonating) return null;
  return <ImpersonationBanner session={session} />;
}
