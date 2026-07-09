-- FoodFlow production realtime outbox.
-- Supabase Realtime streams inserts from this table. Row-level security keeps
-- clients scoped to channels granted by the backend-issued realtime JWT.

CREATE TABLE "realtime_outbox" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "channel" TEXT NOT NULL,
  "event" TEXT NOT NULL,
  "payload" JSONB NOT NULL,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "delivered_at" TIMESTAMPTZ,
  "error" TEXT,

  CONSTRAINT "realtime_outbox_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "realtime_outbox_channel_created_at_idx"
  ON "realtime_outbox" ("channel", "created_at");

ALTER TABLE "realtime_outbox" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "foodflow_realtime_outbox_read_allowed_channels"
  ON "realtime_outbox"
  FOR SELECT
  TO authenticated
  USING (
    "channel" IN (
      SELECT jsonb_array_elements_text(
        COALESCE(
          (NULLIF(current_setting('request.jwt.claims', true), '')::jsonb -> 'realtime_channels'),
          '[]'::jsonb
        )
      )
    )
  );

CREATE POLICY "foodflow_realtime_outbox_service_role_all"
  ON "realtime_outbox"
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_publication
    WHERE pubname = 'supabase_realtime'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE "realtime_outbox";
  END IF;
EXCEPTION
  WHEN duplicate_object THEN
    NULL;
END $$;
