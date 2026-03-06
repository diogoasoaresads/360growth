ALTER TABLE "user_contexts" ADD COLUMN IF NOT EXISTS "active_client_id" text;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "user_contexts" ADD CONSTRAINT "user_contexts_active_client_id_clients_id_fk" FOREIGN KEY ("active_client_id") REFERENCES "public"."clients"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
