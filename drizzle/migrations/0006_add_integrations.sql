-- Add integration_secrets and integrations tables for the Integration Framework v1

CREATE TABLE IF NOT EXISTS "integration_secrets" (
	"id" text PRIMARY KEY NOT NULL,
	"encrypted_payload" text NOT NULL,
	"key_version" integer DEFAULT 1 NOT NULL,
	"rotated_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "integrations" (
	"id" text PRIMARY KEY NOT NULL,
	"agency_id" text NOT NULL,
	"provider" text NOT NULL,
	"status" text DEFAULT 'disconnected' NOT NULL,
	"account_label" text,
	"external_account_id" text,
	"scopes" json,
	"secret_id" text,
	"last_synced_at" timestamp,
	"last_error" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "integrations" ADD CONSTRAINT "integrations_agency_id_agencies_id_fk"
	FOREIGN KEY ("agency_id") REFERENCES "public"."agencies"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "integrations" ADD CONSTRAINT "integrations_secret_id_integration_secrets_id_fk"
	FOREIGN KEY ("secret_id") REFERENCES "public"."integration_secrets"("id") ON DELETE set null ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "integrations_agency_provider_idx"
	ON "integrations" USING btree ("agency_id", "provider");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "integrations_status_idx"
	ON "integrations" USING btree ("status");
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "integrations_agency_provider_unique"
	ON "integrations" USING btree ("agency_id", "provider");
