-- Migration to add active_client_id to user_contexts
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='user_contexts' AND column_name='active_client_id') THEN
        ALTER TABLE "user_contexts" ADD COLUMN "active_client_id" text;
    END IF;
END $$;

DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'user_contexts_active_client_id_clients_id_fk') THEN
        ALTER TABLE "user_contexts" ADD CONSTRAINT "user_contexts_active_client_id_clients_id_fk" FOREIGN KEY ("active_client_id") REFERENCES "public"."clients"("id") ON DELETE set null ON UPDATE no action;
    END IF;
END $$;
