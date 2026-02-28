CREATE TABLE "user_contexts" (
	"user_id" text PRIMARY KEY NOT NULL,
	"active_scope" text DEFAULT 'platform' NOT NULL,
	"active_agency_id" text,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "user_contexts" ADD CONSTRAINT "user_contexts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_contexts" ADD CONSTRAINT "user_contexts_active_agency_id_agencies_id_fk" FOREIGN KEY ("active_agency_id") REFERENCES "public"."agencies"("id") ON DELETE set null ON UPDATE no action;