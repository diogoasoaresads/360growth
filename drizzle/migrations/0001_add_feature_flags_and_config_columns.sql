CREATE TABLE "agency_feature_flags" (
	"id" text PRIMARY KEY NOT NULL,
	"agency_id" text NOT NULL,
	"flag_id" text NOT NULL,
	"enabled" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"updated_by" text,
	CONSTRAINT "agency_feature_flags_unique" UNIQUE("agency_id","flag_id")
);
--> statement-breakpoint
CREATE TABLE "feature_flags" (
	"id" text PRIMARY KEY NOT NULL,
	"key" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"enabled" boolean DEFAULT false NOT NULL,
	"rollout_percent" integer DEFAULT 100 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"updated_by" text,
	CONSTRAINT "feature_flags_key_unique" UNIQUE("key")
);
--> statement-breakpoint
ALTER TABLE "platform_settings" ADD COLUMN "type" text DEFAULT 'string' NOT NULL;--> statement-breakpoint
ALTER TABLE "platform_settings" ADD COLUMN "description" text;--> statement-breakpoint
ALTER TABLE "platform_settings" ADD COLUMN "is_secret" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "agency_feature_flags" ADD CONSTRAINT "agency_feature_flags_agency_id_agencies_id_fk" FOREIGN KEY ("agency_id") REFERENCES "public"."agencies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agency_feature_flags" ADD CONSTRAINT "agency_feature_flags_flag_id_feature_flags_id_fk" FOREIGN KEY ("flag_id") REFERENCES "public"."feature_flags"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agency_feature_flags" ADD CONSTRAINT "agency_feature_flags_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "feature_flags" ADD CONSTRAINT "feature_flags_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "agency_feature_flags_agency_id_idx" ON "agency_feature_flags" USING btree ("agency_id");--> statement-breakpoint
CREATE INDEX "agency_feature_flags_flag_id_idx" ON "agency_feature_flags" USING btree ("flag_id");