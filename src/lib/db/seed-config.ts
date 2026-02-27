/**
 * Seed: Platform Settings & Feature Flags
 *
 * Run with:
 *   npx tsx src/lib/db/seed-config.ts
 *
 * Safe to run multiple times — uses ON CONFLICT DO NOTHING for platform_settings
 * and ON CONFLICT DO UPDATE for feature_flags (updates name/description if key exists).
 */

import { db } from "./index";
import { platformSettings, featureFlags } from "./schema";

// ============================================================
// PLATFORM SETTINGS
// ============================================================

const INITIAL_PLATFORM_SETTINGS: Array<{
  key: string;
  value: string;
  type: "string" | "number" | "boolean" | "json";
  description: string;
  isSecret: boolean;
}> = [
  {
    key: "platform.appName",
    value: "360growth",
    type: "string",
    description: "Nome da plataforma exibido na interface",
    isSecret: false,
  },
  {
    key: "platform.publicUrl",
    value: "",
    type: "string",
    description: "URL pública da aplicação (ex: https://app.360growth.com)",
    isSecret: false,
  },
  {
    key: "platform.supportEmail",
    value: "suporte@360growth.com",
    type: "string",
    description: "Email de suporte exibido aos usuários",
    isSecret: false,
  },
  {
    key: "platform.emailFrom",
    value: "360growth <noreply@360growth.com>",
    type: "string",
    description: "Remetente padrão de todos os emails transacionais",
    isSecret: false,
  },
  {
    key: "platform.defaultPlanId",
    value: "",
    type: "string",
    description: "ID do plano padrão aplicado no cadastro de novas agências",
    isSecret: false,
  },
  {
    key: "platform.trialDays",
    value: "14",
    type: "number",
    description: "Número de dias de período trial para novas agências",
    isSecret: false,
  },
  {
    key: "platform.allowSelfSignup",
    value: "true",
    type: "boolean",
    description: "Permite que qualquer pessoa crie uma conta via /register",
    isSecret: false,
  },
  {
    key: "platform.maintenanceMode",
    value: "false",
    type: "boolean",
    description: "Quando true, exibe página de manutenção para todos os usuários não-admin",
    isSecret: false,
  },
  {
    key: "platform.maxAgencies",
    value: "0",
    type: "number",
    description: "Limite máximo de agências na plataforma (0 = ilimitado)",
    isSecret: false,
  },
  {
    key: "platform.maxUsersPerAgencyDefault",
    value: "0",
    type: "number",
    description: "Limite padrão de usuários por agência (0 = sem limite, pode ser sobrescrito pelo plano)",
    isSecret: false,
  },
];

// ============================================================
// FEATURE FLAGS
// ============================================================

const INITIAL_FEATURE_FLAGS: Array<{
  key: string;
  name: string;
  description: string;
  enabled: boolean;
}> = [
  {
    key: "module.admin.enabled",
    name: "Módulo Admin",
    description: "Habilita o painel de administração da plataforma (/admin)",
    enabled: true,
  },
  {
    key: "module.agency.enabled",
    name: "Módulo Agência",
    description: "Habilita a área de gestão da agência (/agency)",
    enabled: true,
  },
  {
    key: "module.portal.enabled",
    name: "Portal do Cliente",
    description: "Habilita o portal de acesso para clientes (/portal)",
    enabled: true,
  },
  {
    key: "module.crm.enabled",
    name: "Módulo CRM",
    description: "Habilita o pipeline de deals, clientes e contatos no CRM",
    enabled: true,
  },
  {
    key: "module.tickets.enabled",
    name: "Módulo Tickets",
    description: "Habilita o sistema de suporte e tickets",
    enabled: true,
  },
  {
    key: "module.billing.enabled",
    name: "Módulo Faturamento",
    description: "Habilita funcionalidades de faturamento e assinaturas",
    enabled: true,
  },
  {
    key: "integration.stripe.enabled",
    name: "Integração Stripe",
    description: "Habilita pagamentos e assinaturas via Stripe",
    enabled: false,
  },
  {
    key: "integration.resend.enabled",
    name: "Integração Resend",
    description: "Habilita envio de emails transacionais via Resend",
    enabled: false,
  },
];

async function seedConfig() {
  console.log("🌱 Seeding platform settings...");

  for (const setting of INITIAL_PLATFORM_SETTINGS) {
    await db
      .insert(platformSettings)
      .values({
        key: setting.key,
        value: setting.value,
        type: setting.type,
        description: setting.description,
        isSecret: setting.isSecret,
      })
      .onConflictDoNothing();

    console.log(`  ✓ ${setting.key}`);
  }

  console.log("\n🌱 Seeding feature flags...");

  for (const flag of INITIAL_FEATURE_FLAGS) {
    await db
      .insert(featureFlags)
      .values({
        key: flag.key,
        name: flag.name,
        description: flag.description,
        enabled: flag.enabled,
        rolloutPercent: 100,
      })
      .onConflictDoUpdate({
        target: featureFlags.key,
        set: {
          name: flag.name,
          description: flag.description,
          updatedAt: new Date(),
        },
      });

    console.log(`  ✓ ${flag.key} [${flag.enabled ? "ON" : "OFF"}]`);
  }

  console.log("\n✅ Config seed completed.");
}

seedConfig()
  .catch((err) => {
    console.error("❌ Seed failed:", err);
    process.exit(1);
  })
  .finally(() => process.exit(0));
