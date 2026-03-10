/**
 * Seed: Platform Message Templates
 *
 * Run with:
 *   npx tsx src/lib/db/seed-templates.ts
 *
 * Safe to run multiple times — checks existence before inserting/updating.
 */

import { db } from "./index";
import { messageTemplates } from "./schema";
import { and, eq, isNull } from "drizzle-orm";

const PLATFORM_TEMPLATES: Array<{
  key: string;
  channel: string;
  subject: string;
  body: string;
  variablesAllowed: string[];
}> = [
  {
    key: "password_reset",
    channel: "email",
    subject: "Redefinição de senha - {{appName}}",
    body: `# Redefinição de senha

Olá, {{userName}}!

Recebemos uma solicitação para redefinir a senha da sua conta no **{{appName}}**.

[Redefinir minha senha]({{resetUrl}})

Este link expira em **{{expiresIn}}**.

Se você não solicitou a redefinição, ignore este e-mail — sua senha permanece inalterada.`,
    variablesAllowed: ["resetUrl", "userName", "appName", "expiresIn"],
  },
];

async function main() {
  console.log("Seeding platform message templates...");

  for (const tpl of PLATFORM_TEMPLATES) {
    const existing = await db.query.messageTemplates.findFirst({
      where: and(
        eq(messageTemplates.key, tpl.key),
        eq(messageTemplates.channel, tpl.channel),
        isNull(messageTemplates.agencyId)
      ),
    });

    if (existing) {
      await db
        .update(messageTemplates)
        .set({
          subject: tpl.subject,
          body: tpl.body,
          variablesAllowed: tpl.variablesAllowed,
          updatedAt: new Date(),
        })
        .where(eq(messageTemplates.id, existing.id));
      console.log(`  updated: ${tpl.key}`);
    } else {
      await db.insert(messageTemplates).values({
        scope: "platform",
        agencyId: null,
        key: tpl.key,
        channel: tpl.channel,
        subject: tpl.subject,
        body: tpl.body,
        variablesAllowed: tpl.variablesAllowed,
        isActive: true,
      });
      console.log(`  inserted: ${tpl.key}`);
    }
  }

  console.log("Done.");
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
