-- Composite index for efficient per-agency timeline queries (ordered by created_at DESC)
CREATE INDEX IF NOT EXISTS "audit_logs_agency_created_idx"
  ON "audit_logs"("agency_id", "created_at" DESC);
