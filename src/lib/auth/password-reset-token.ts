/**
 * Password reset token utilities.
 * No "use server" — safe to import from server actions and API routes.
 */

import { randomBytes } from "crypto";
import { db } from "@/lib/db";
import { verificationTokens } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

const EXPIRY_MS = 60 * 60 * 1000; // 1 hour

function identifier(email: string) {
  return `password-reset:${email}`;
}

/**
 * Deletes any existing reset token for this email and inserts a fresh one.
 * Returns the raw token string.
 */
export async function generatePasswordResetToken(email: string): Promise<string> {
  const token = randomBytes(32).toString("hex");
  const id = identifier(email);
  const expires = new Date(Date.now() + EXPIRY_MS);

  // Remove any existing token first to keep the table clean
  await db.delete(verificationTokens).where(eq(verificationTokens.identifier, id));

  await db.insert(verificationTokens).values({ identifier: id, token, expires });
  return token;
}

/**
 * Deletes the reset token for an email (call after successful password reset).
 */
export async function deletePasswordResetToken(email: string): Promise<void> {
  await db.delete(verificationTokens).where(eq(verificationTokens.identifier, identifier(email)));
}
