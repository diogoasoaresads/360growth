import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getActiveAgencyIdOrThrow } from "@/lib/active-context";
import { signOAuthState } from "@/lib/integrations/providers/google-ads";

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

  const clientId = process.env.GOOGLE_OAUTH_CLIENT_ID;
  const redirectUri = process.env.GOOGLE_OAUTH_REDIRECT_URI;

  if (!clientId || !redirectUri) {
    const url = new URL("/agency/integrations", APP_URL);
    url.searchParams.set("oauth_error", "config_missing");
    return NextResponse.redirect(url);
  }

  const scopes =
    process.env.GOOGLE_OAUTH_SCOPES ??
    "https://www.googleapis.com/auth/adwords https://www.googleapis.com/auth/userinfo.email";

  const state = signOAuthState({
    ownerScope: "agency",
    ownerId: agencyId,
    userId: session.user.id,
    returnTo: "/agency/integrations",
  });

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    access_type: "offline",
    prompt: "consent",
    scope: scopes,
    state,
  });

  const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  return NextResponse.redirect(authUrl);
}
