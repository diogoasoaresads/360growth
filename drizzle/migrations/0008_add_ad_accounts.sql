-- Add ad_accounts and ad_campaigns tables for Google Ads read-only sync

CREATE TABLE IF NOT EXISTS "ad_accounts" (
	"id" text PRIMARY KEY NOT NULL,
	"owner_scope" text NOT NULL,
	"owner_id" text NOT NULL,
	"provider" text DEFAULT 'GOOGLE_ADS' NOT NULL,
	"external_account_id" text NOT NULL,
	"name" text,
	"currency_code" text,
	"time_zone" text,
	"is_manager" boolean,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "ad_accounts_owner_provider_external_unique" UNIQUE("owner_scope","owner_id","provider","external_account_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "ad_campaigns" (
	"id" text PRIMARY KEY NOT NULL,
	"owner_scope" text NOT NULL,
	"owner_id" text NOT NULL,
	"provider" text DEFAULT 'GOOGLE_ADS' NOT NULL,
	"external_account_id" text NOT NULL,
	"campaign_id" text NOT NULL,
	"name" text NOT NULL,
	"status" text,
	"channel_type" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "ad_campaigns_owner_provider_account_campaign_unique" UNIQUE("owner_scope","owner_id","provider","external_account_id","campaign_id")
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "ad_accounts_owner_idx"
	ON "ad_accounts" USING btree ("owner_scope", "owner_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "ad_accounts_provider_idx"
	ON "ad_accounts" USING btree ("provider");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "ad_campaigns_owner_idx"
	ON "ad_campaigns" USING btree ("owner_scope", "owner_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "ad_campaigns_external_account_idx"
	ON "ad_campaigns" USING btree ("external_account_id");
