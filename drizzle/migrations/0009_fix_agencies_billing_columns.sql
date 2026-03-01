-- Migration 0009: Rename Stripe billing columns → Asaas billing columns
-- Safe/idempotent: uses DO $$ blocks that check column existence before acting.
-- This corrects a schema drift where schema.ts was updated (BUILD 0018) without
-- a corresponding migration, leaving production DBs with the old column names.

DO $$
BEGIN
  -- 1) stripe_customer_id → asaas_customer_id
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'agencies' AND column_name = 'stripe_customer_id'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'agencies' AND column_name = 'asaas_customer_id'
  ) THEN
    ALTER TABLE agencies RENAME COLUMN stripe_customer_id TO asaas_customer_id;
  END IF;

  -- 2) stripe_subscription_id → asaas_subscription_id
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'agencies' AND column_name = 'stripe_subscription_id'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'agencies' AND column_name = 'asaas_subscription_id'
  ) THEN
    ALTER TABLE agencies RENAME COLUMN stripe_subscription_id TO asaas_subscription_id;
  END IF;

  -- 3) subscription_status → billing_status
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'agencies' AND column_name = 'subscription_status'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'agencies' AND column_name = 'billing_status'
  ) THEN
    ALTER TABLE agencies RENAME COLUMN subscription_status TO billing_status;
  END IF;

  -- 4) Fix default on billing_status (was 'inactive', now 'trial') and migrate stale values
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'agencies' AND column_name = 'billing_status'
  ) THEN
    ALTER TABLE agencies ALTER COLUMN billing_status SET DEFAULT 'trial';
    UPDATE agencies SET billing_status = 'trial' WHERE billing_status = 'inactive';
  END IF;

  -- 5) Add current_period_end column if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'agencies' AND column_name = 'current_period_end'
  ) THEN
    ALTER TABLE agencies ADD COLUMN current_period_end timestamp;
  END IF;
END $$;
