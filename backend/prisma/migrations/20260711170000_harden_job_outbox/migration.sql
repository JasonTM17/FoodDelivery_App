-- Preserve BullMQ-style jobId deduplication when production uses the
-- Supabase/Postgres queue adapter. Existing rows remain nullable because
-- historical options may contain legacy/invalid identifiers.

ALTER TABLE "job_outbox"
  ADD COLUMN "dedupe_key" VARCHAR(200);

CREATE UNIQUE INDEX "job_outbox_queue_dedupe_key_key"
  ON "job_outbox" ("queue", "dedupe_key");
