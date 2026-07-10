-- Records only actual AI provider attempts. Cost is intentionally excluded: it
-- must come from a provider billing source, never a locally invented estimate.

ALTER TYPE "ChatSenderType" ADD VALUE IF NOT EXISTS 'admin';

CREATE TYPE "AiUsageOutcome" AS ENUM ('succeeded', 'failed');

CREATE TABLE "ai_usage_events" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "session_id" UUID,
  "user_id" UUID,
  "provider" VARCHAR(64) NOT NULL,
  "model" VARCHAR(128) NOT NULL,
  "outcome" "AiUsageOutcome" NOT NULL,
  "input_tokens" INTEGER,
  "output_tokens" INTEGER,
  "latency_ms" INTEGER NOT NULL,
  "error_code" VARCHAR(128),
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT "ai_usage_events_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "ai_usage_events_session_id_fkey"
    FOREIGN KEY ("session_id") REFERENCES "chat_sessions"("id") ON DELETE SET NULL,
  CONSTRAINT "ai_usage_events_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL
);

CREATE INDEX "ai_usage_events_created_at_idx"
  ON "ai_usage_events" ("created_at");

CREATE INDEX "ai_usage_events_provider_outcome_created_at_idx"
  ON "ai_usage_events" ("provider", "outcome", "created_at");

CREATE INDEX "ai_usage_events_user_id_created_at_idx"
  ON "ai_usage_events" ("user_id", "created_at");

ALTER TABLE "ai_usage_events" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "foodflow_ai_usage_events_service_role_all"
  ON "ai_usage_events"
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
