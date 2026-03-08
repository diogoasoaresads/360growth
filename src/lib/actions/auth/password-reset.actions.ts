"use server";

import { hash } from "bcryptjs";
import { db } from "@/lib/db";
import { users, verificationTokens } from "@/lib/db/schema";
import { eq, and, gt } from "drizzle-orm";
import { sendSystemEmail } from "@/lib/messaging/email";
import { createAuditLog } from "@/lib/audit-log";
import {
  generatePasswordResetToken,
  deletePasswordResetToken,
} from "@/lib/auth/password-reset-token";
import {
  forgotPasswordSchema,
  resetPasswordSchema,
  type ForgotPasswordInput,
  type ResetPasswordInput,
} from "@/lib/validations/password-reset";
import type { ActionResult } from "@/lib/types";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

export async function requestPasswordReset(
  input: ForgotPasswordInput
): Promise<ActionResult<void>> {
  try {
    const parsed = forgotPasswordSchema.safeParse(input);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos" };
    }

    const { email } = parsed.data;

    const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);

    // Always return success to avoid leaking user existence
    if (!user) {
      return { success: true, data: undefined };
    }

    const token = await generatePasswordResetToken(email);
    const resetUrl = `${APP_URL}/reset-password?token=${token}&email=${encodeURIComponent(email)}`;

    await sendSystemEmail({
      to: email,
      templateKey: "password_reset",
      variables: {
        resetUrl,
        userName: user.name ?? "Usuário",
        appName: "360growth",
        expiresIn: "1 hora",
      },
      actorUserId: user.id,
    });

    await createAuditLog({
      userId: user.id,
      action: "auth.password_reset_requested",
      details: { email },
    });

    return { success: true, data: undefined };
  } catch (err) {
    console.error("[requestPasswordReset]", err);
    return { success: false, error: "Erro ao processar solicitação" };
  }
}

export async function resetPassword(
  input: ResetPasswordInput
): Promise<ActionResult<void>> {
  try {
    const parsed = resetPasswordSchema.safeParse(input);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos" };
    }

    const { token, email, password } = parsed.data;

    // Look up valid, non-expired token
    const [row] = await db
      .select()
      .from(verificationTokens)
      .where(
        and(
          eq(verificationTokens.identifier, `password-reset:${email}`),
          eq(verificationTokens.token, token),
          gt(verificationTokens.expires, new Date())
        )
      )
      .limit(1);

    if (!row) {
      return { success: false, error: "Link inválido ou expirado" };
    }

    const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);
    if (!user) {
      return { success: false, error: "Usuário não encontrado" };
    }

    const passwordHash = await hash(password, 12);

    await db
      .update(users)
      .set({ passwordHash, updatedAt: new Date() })
      .where(eq(users.id, user.id));

    await deletePasswordResetToken(email);

    await createAuditLog({
      userId: user.id,
      action: "auth.password_reset_completed",
    });

    return { success: true, data: undefined };
  } catch (err) {
    console.error("[resetPassword]", err);
    return { success: false, error: "Erro ao redefinir senha" };
  }
}
