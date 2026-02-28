import "server-only";

import { resend } from "@/lib/resend";
import { resolveEmailTemplate, renderTemplate, renderSubject } from "./templates";
import { createAuditLog } from "@/lib/audit-log";

export interface SendSystemEmailParams {
  to: string;
  templateKey: string;
  agencyId?: string;
  variables?: Record<string, string>;
  /** Optional userId for audit log. If omitted, audit log is skipped. */
  actorUserId?: string;
}

/**
 * Resolves a message template (agency override → platform fallback),
 * renders Markdown → HTML with variable substitution, and sends via Resend.
 *
 * Gracefully no-ops when RESEND_API_KEY is not configured.
 * Never throws — all errors are caught and logged to console.
 */
export async function sendSystemEmail({
  to,
  templateKey,
  agencyId,
  variables = {},
  actorUserId,
}: SendSystemEmailParams): Promise<void> {
  try {
    const template = await resolveEmailTemplate({ templateKey, agencyId });

    const subject = renderSubject(template.subject, variables);
    const { html } = renderTemplate({ text: template.body, variables });

    if (!process.env.RESEND_API_KEY) {
      console.log(`[email] no-op (RESEND_API_KEY not set): ${templateKey} → ${to}`);
      return;
    }

    await resend.emails.send({
      from: process.env.EMAIL_FROM ?? "noreply@360growth.com",
      to,
      subject,
      html,
    });

    if (actorUserId) {
      await createAuditLog({
        userId: actorUserId,
        action: "email_sent",
        agencyId: agencyId ?? null,
        details: { templateKey, to, subject },
      });
    }
  } catch (err) {
    // Silent fail — email must never break the calling action
    console.error(`[email] failed to send "${templateKey}" to ${to}:`, err);
  }
}
