-- Add lastTestedAt to integrations and create integration_jobs table

ALTER TABLE "integrations" ADD COLUMN IF NOT EXISTS "last_tested_at" timestamp;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "integration_jobs" (
	"id" text PRIMARY KEY NOT NULL,
	"integration_id" text NOT NULL,
	"owner_scope" text DEFAULT 'agency' NOT NULL,
	"owner_id" text NOT NULL,
	"provider" text NOT NULL,
	"type" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"attempts" integer DEFAULT 0 NOT NULL,
	"max_attempts" integer DEFAULT 3 NOT NULL,
	"last_error" text,
	"meta" json,
	"started_at" timestamp,
	"finished_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "integration_jobs" ADD CONSTRAINT "integration_jobs_integration_id_integrations_id_fk"
	FOREIGN KEY ("integration_id") REFERENCES "public"."integrations"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "integration_jobs_integration_created_idx"
	ON "integration_jobs" USING btree ("integration_id", "created_at");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "integration_jobs_provider_status_idx"
	ON "integration_jobs" USING btree ("provider", "status");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "integration_jobs_owner_idx"
	ON "integration_jobs" USING btree ("owner_scope", "owner_id");
