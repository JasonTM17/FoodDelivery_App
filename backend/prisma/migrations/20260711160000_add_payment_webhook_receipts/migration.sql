-- Durable SePay receipt ledger. The provider transaction id remains stable
-- across automatic retries and historical manual replays, so database
-- uniqueness is the authoritative idempotency boundary.

CREATE TABLE "payment_webhook_receipts" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "provider" VARCHAR(20) NOT NULL,
  "provider_transaction_id" VARCHAR(100) NOT NULL,
  "payment_intent_id" UUID,
  "order_id" UUID,
  "amount" INTEGER NOT NULL,
  "bank_reference" VARCHAR(100),
  "status" VARCHAR(20) NOT NULL DEFAULT 'processing',
  "failure_code" VARCHAR(100),
  "received_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "processed_at" TIMESTAMPTZ,
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT "payment_webhook_receipts_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "payment_webhook_receipts_payment_intent_id_fkey"
    FOREIGN KEY ("payment_intent_id") REFERENCES "payment_intents"("id")
    ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT "payment_webhook_receipts_order_id_fkey"
    FOREIGN KEY ("order_id") REFERENCES "orders"("id")
    ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT "payment_webhook_receipts_amount_positive" CHECK ("amount" > 0),
  CONSTRAINT "payment_webhook_receipts_status_valid"
    CHECK ("status" IN ('processing', 'completed', 'manual_review', 'failed', 'ignored'))
);

CREATE UNIQUE INDEX "payment_webhook_receipts_provider_provider_transaction_id_key"
  ON "payment_webhook_receipts" ("provider", "provider_transaction_id");

CREATE INDEX "payment_webhook_receipts_order_id_received_at_idx"
  ON "payment_webhook_receipts" ("order_id", "received_at" DESC);

CREATE INDEX "payment_webhook_receipts_status_updated_at_idx"
  ON "payment_webhook_receipts" ("status", "updated_at");

ALTER TABLE "payment_webhook_receipts" ENABLE ROW LEVEL SECURITY;

DO $roles$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'service_role') THEN
    EXECUTE 'GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE "payment_webhook_receipts" TO service_role';
    EXECUTE $policy$
      CREATE POLICY "foodflow_payment_webhook_receipts_service_role_all"
        ON "payment_webhook_receipts"
        FOR ALL
        TO service_role
        USING (true)
        WITH CHECK (true)
    $policy$;
  END IF;
END
$roles$;
