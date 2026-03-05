-- Custom migration to add tasks and automation_workflows tables
-- Manually created to bypass interactive prompt issues with asaas_* columns

CREATE TABLE IF NOT EXISTS "tasks" (
	"id" text PRIMARY KEY NOT NULL,
	"agency_id" text NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"status" text DEFAULT 'PENDING' NOT NULL,
	"priority" text DEFAULT 'MEDIUM' NOT NULL,
	"due_date" timestamp,
	"responsible_id" text,
	"entity_type" text,
	"entity_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "automation_workflows" (
	"id" text PRIMARY KEY NOT NULL,
	"agency_id" text NOT NULL,
	"name" text NOT NULL,
	"trigger_event" text NOT NULL,
	"trigger_conditions" json,
	"actions" json NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "tasks_agency_idx" ON "tasks" ("agency_id");
CREATE INDEX IF NOT EXISTS "tasks_status_idx" ON "tasks" ("status");
CREATE INDEX IF NOT EXISTS "tasks_entity_idx" ON "tasks" ("entity_type","entity_id");
CREATE INDEX IF NOT EXISTS "automation_workflows_agency_idx" ON "automation_workflows" ("agency_id");

DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'tasks_agency_id_agencies_id_fk') THEN
        ALTER TABLE "tasks" ADD CONSTRAINT "tasks_agency_id_agencies_id_fk" FOREIGN KEY ("agency_id") REFERENCES "public"."agencies"("id") ON DELETE cascade ON UPDATE no action;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'tasks_responsible_id_users_id_fk') THEN
        ALTER TABLE "tasks" ADD CONSTRAINT "tasks_responsible_id_users_id_fk" FOREIGN KEY ("responsible_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'automation_workflows_agency_id_agencies_id_fk') THEN
        ALTER TABLE "automation_workflows" ADD CONSTRAINT "automation_workflows_agency_id_agencies_id_fk" FOREIGN KEY ("agency_id") REFERENCES "public"."agencies"("id") ON DELETE cascade ON UPDATE no action;
    END IF;
END $$;
