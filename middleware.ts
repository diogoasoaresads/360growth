import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const session = req.auth;

  // Inject x-pathname header so server layouts can read the current path
  const requestHeaders = new Headers(req.headers);
  requestHeaders.set("x-pathname", pathname);

  function next() {
    return NextResponse.next({ request: { headers: requestHeaders } });
  }

  // Public routes - no auth needed
  const publicRoutes = ["/", "/login", "/register", "/api/auth", "/api/webhooks", "/s/"];
  const isPublicRoute = publicRoutes.some((route) => pathname.startsWith(route));

  if (isPublicRoute) {
    if (session && (pathname === "/login" || pathname === "/register")) {
      return redirectToDashboard(req, session.user.role);
    }
    return next();
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
    return next();
  }

  // AGENCY routes
  if (pathname.startsWith("/agency")) {
    // SUPER_ADMIN: always allowed — agency layout validates DB context
    if (role === "SUPER_ADMIN") {
      return next();
    }

    // CLIENT cannot access /agency/*
    if (role === "CLIENT") {
      return NextResponse.redirect(new URL("/unauthorized", req.url));
    }

    // AGENCY_ADMIN and AGENCY_MEMBER: normal access
    if (role !== "AGENCY_ADMIN" && role !== "AGENCY_MEMBER") {
      return NextResponse.redirect(new URL("/unauthorized", req.url));
    }
    return next();
  }

  // CLIENT portal routes
  if (pathname.startsWith("/portal")) {
    // SUPER_ADMIN allowed — portal layout validates DB context (client scope)
    if (role === "SUPER_ADMIN" || role === "CLIENT") {
      return next();
    }
    return NextResponse.redirect(new URL("/unauthorized", req.url));
  }

  return next();
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
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
