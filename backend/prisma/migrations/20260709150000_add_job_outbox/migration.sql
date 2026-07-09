-- FoodFlow production job outbox for Supabase/Postgres-backed queues.
-- Vercel Cron/secure worker endpoints drain this table; local development keeps BullMQ.

CREATE TABLE "job_outbox" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "queue" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "payload" JSONB NOT NULL,
  "options" JSONB,
  "status" TEXT NOT NULL DEFAULT 'queued',
  "attempts" INTEGER NOT NULL DEFAULT 0,
  "run_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "completed_at" TIMESTAMPTZ,
  "failed_at" TIMESTAMPTZ,
  "error" TEXT,

  CONSTRAINT "job_outbox_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "job_outbox_queue_status_run_at_idx"
  ON "job_outbox" ("queue", "status", "run_at");

ALTER TABLE "job_outbox" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "foodflow_job_outbox_service_role_all"
  ON "job_outbox"
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
