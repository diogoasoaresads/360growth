import type { ActiveScope } from "@/lib/db/schema";

export type { ActiveScope };

export const SCOPE_COOKIE = "admin_scope";
export const AGENCY_ID_COOKIE = "admin_agency_id";

export const COOKIE_OPTS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
  maxAge: 60 * 60 * 24 * 7, // 7 days
};
