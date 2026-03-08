import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getActiveAgencyIdOrThrow } from "@/lib/active-context";
import { signOAuthState, getGA4AuthorizationUrl } from "@/lib/integrations/providers/ga4";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

export async function GET(): Promise<NextResponse> {
  const session = await auth();
  if (!session) {
    return NextResponse.redirect(new URL("/login", APP_URL));
  }

  const { role } = session.user;
  if (role !== "AGENCY_ADMIN" && role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Acesso negado." }, { status: 403 });
  }

  let agencyId: string;
  try {
    agencyId = await getActiveAgencyIdOrThrow();
  } catch {
    const url = new URL("/agency/integrations", APP_URL);
    url.searchParams.set("oauth_error", "no_agency_context");
    return NextResponse.redirect(url);
  }

  if (!process.env.GOOGLE_OAUTH_CLIENT_ID || !process.env.GA4_OAUTH_REDIRECT_URI) {
    const url = new URL("/agency/integrations", APP_URL);
    url.searchParams.set("oauth_error", "config_missing");
    return NextResponse.redirect(url);
  }

  const state = signOAuthState({
    ownerScope: "agency",
    ownerId: agencyId,
    userId: session.user.id,
    returnTo: "/agency/integrations",
  });

  const authUrl = getGA4AuthorizationUrl(state);
  return NextResponse.redirect(authUrl);
}
