CREATE TABLE IF NOT EXISTS "message_templates" (
  "id" text PRIMARY KEY DEFAULT gen_random_uuid(),
  "scope" text NOT NULL,
  "agency_id" text REFERENCES "agencies"("id") ON DELETE CASCADE,
  "key" text NOT NULL,
  "channel" text NOT NULL DEFAULT 'email',
  "subject" text NOT NULL,
  "body" text NOT NULL,
  "variables_allowed" json,
  "is_active" boolean NOT NULL DEFAULT true,
  "created_at" timestamp NOT NULL DEFAULT now(),
  "updated_at" timestamp NOT NULL DEFAULT now(),
  "updated_by" text REFERENCES "users"("id") ON DELETE SET NULL
);

-- Platform templates: unique on (scope, key, channel) where agency_id IS NULL
CREATE UNIQUE INDEX IF NOT EXISTS "mt_platform_unique"
  ON "message_templates"("scope","key","channel")
  WHERE "agency_id" IS NULL;

-- Agency overrides: unique on (agency_id, key, channel)
CREATE UNIQUE INDEX IF NOT EXISTS "mt_agency_unique"
  ON "message_templates"("agency_id","key","channel")
  WHERE "agency_id" IS NOT NULL;

-- Seed default platform templates
INSERT INTO "message_templates" ("scope","key","channel","subject","body","variables_allowed","is_active")
VALUES
(
  'platform',
  'welcome_user',
  'email',
  'Bem-vindo(a) ao {{agencyName}}',
  '# Bem-vindo(a), {{userName}}!

Sua conta na agência **{{agencyName}}** foi criada com sucesso.

Para acessar o sistema, use o link abaixo:

[Acessar plataforma]({{loginUrl}})

Se tiver dúvidas, entre em contato com o suporte da sua agência.',
  '["userName","agencyName","loginUrl"]',
  true
),
(
  'platform',
  'limit_blocked',
  'email',
  'Limite do plano atingido: {{resourceType}}',
  '# Limite do plano atingido

Olá equipe da **{{agencyName}}**,

O limite de **{{resourceType}}** do plano atual foi atingido.

- Uso atual: **{{usage}}**
- Limite do plano: **{{limit}}**

Novos registros de **{{resourceType}}** estão bloqueados até que o plano seja atualizado.

[Fazer upgrade do plano]({{upgradeUrl}})',
  '["agencyName","resourceType","usage","limit","upgradeUrl"]',
  true
)
ON CONFLICT DO NOTHING;
