import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { SCOPE_COOKIE, AGENCY_ID_COOKIE } from "@/lib/actions/admin/context.constants";

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const session = req.auth;

  // Public routes - no auth needed
  const publicRoutes = ["/", "/login", "/register", "/api/auth"];
  const isPublicRoute = publicRoutes.some((route) => pathname.startsWith(route));

  if (isPublicRoute) {
    // If already logged in, redirect from auth pages to appropriate dashboard
    if (session && (pathname === "/login" || pathname === "/register")) {
      return redirectToDashboard(req, session.user.role);
    }
    return NextResponse.next();
  }

  // Not authenticated - redirect to login
  if (!session) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  const { role } = session.user;

  // SUPER_ADMIN routes
  if (pathname.startsWith("/super-admin") || pathname.startsWith("/admin")) {
    if (role !== "SUPER_ADMIN") {
      return NextResponse.redirect(new URL("/unauthorized", req.url));
    }
    return NextResponse.next();
  }

  // AGENCY routes
  if (pathname.startsWith("/agency")) {
    // SUPER_ADMIN can only access /agency/* when in agency context with a valid agencyId
    if (role === "SUPER_ADMIN") {
      const scope = req.cookies.get(SCOPE_COOKIE)?.value;
      const agencyId = req.cookies.get(AGENCY_ID_COOKIE)?.value;
      if (scope === "agency" && agencyId) {
        return NextResponse.next();
      }
      // No agency context set — redirect to admin dashboard
      return NextResponse.redirect(new URL("/admin", req.url));
    }

    // CLIENT cannot access /agency/*
    if (role === "CLIENT") {
      return NextResponse.redirect(new URL("/unauthorized", req.url));
    }

    // AGENCY_ADMIN and AGENCY_MEMBER: normal access
    if (role !== "AGENCY_ADMIN" && role !== "AGENCY_MEMBER") {
      return NextResponse.redirect(new URL("/unauthorized", req.url));
    }
    return NextResponse.next();
  }

  // CLIENT portal routes
  if (pathname.startsWith("/portal")) {
    if (role !== "CLIENT") {
      return NextResponse.redirect(new URL("/unauthorized", req.url));
    }
    return NextResponse.next();
  }

  return NextResponse.next();
});

function redirectToDashboard(req: NextRequest, role: string) {
  switch (role) {
    case "SUPER_ADMIN":
      return NextResponse.redirect(new URL("/admin", req.url));
    case "AGENCY_ADMIN":
    case "AGENCY_MEMBER":
      return NextResponse.redirect(new URL("/agency/dashboard", req.url));
    case "CLIENT":
      return NextResponse.redirect(new URL("/portal/dashboard", req.url));
    default:
      return NextResponse.redirect(new URL("/login", req.url));
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (public folder)
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
