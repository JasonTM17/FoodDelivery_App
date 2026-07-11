-- Durable refund workflow and ledger idempotency. Existing payout rows receive
-- a legacy key based on their primary key so this migration is safe even if a
-- previous worker retry already produced duplicates.

CREATE TABLE "payment_refund_requests" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "refund_key" VARCHAR(200) NOT NULL,
  "order_id" UUID NOT NULL,
  "payment_id" UUID NOT NULL,
  "amount" INTEGER NOT NULL,
  "kind" VARCHAR(20) NOT NULL,
  "reason" TEXT NOT NULL,
  "method" "PaymentMethod" NOT NULL,
  "status" VARCHAR(20) NOT NULL DEFAULT 'queued',
  "attempts" INTEGER NOT NULL DEFAULT 0,
  "processing_job_id" VARCHAR(200),
  "failure_code" VARCHAR(100),
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "completed_at" TIMESTAMPTZ,

  CONSTRAINT "payment_refund_requests_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "payment_refund_requests_amount_positive" CHECK ("amount" > 0),
  CONSTRAINT "payment_refund_requests_kind_valid" CHECK ("kind" IN ('full', 'partial')),
  CONSTRAINT "payment_refund_requests_status_valid"
    CHECK ("status" IN ('queued', 'processing', 'completed', 'manual_review', 'failed')),
  CONSTRAINT "payment_refund_requests_order_id_fkey"
    FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "payment_refund_requests_payment_id_fkey"
    FOREIGN KEY ("payment_id") REFERENCES "payments"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "payment_refund_requests_refund_key_key"
  ON "payment_refund_requests" ("refund_key");
CREATE INDEX "payment_refund_requests_order_id_status_idx"
  ON "payment_refund_requests" ("order_id", "status");
CREATE INDEX "payment_refund_requests_status_updated_at_idx"
  ON "payment_refund_requests" ("status", "updated_at");

ALTER TABLE "wallet_transactions"
  ADD COLUMN "refund_request_id" UUID;
CREATE UNIQUE INDEX "wallet_transactions_refund_request_id_key"
  ON "wallet_transactions" ("refund_request_id");
ALTER TABLE "wallet_transactions"
  ADD CONSTRAINT "wallet_transactions_refund_request_id_fkey"
  FOREIGN KEY ("refund_request_id") REFERENCES "payment_refund_requests"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "payout_ledger"
  ADD COLUMN "dedupe_key" VARCHAR(200),
  ADD COLUMN "refund_request_id" UUID;

UPDATE "payout_ledger"
SET "dedupe_key" = 'legacy:' || "id"::text
WHERE "dedupe_key" IS NULL;

ALTER TABLE "payout_ledger"
  ALTER COLUMN "dedupe_key" SET NOT NULL;

CREATE UNIQUE INDEX "payout_ledger_dedupe_key_key"
  ON "payout_ledger" ("dedupe_key");
CREATE UNIQUE INDEX "payout_ledger_refund_request_id_key"
  ON "payout_ledger" ("refund_request_id");
ALTER TABLE "payout_ledger"
  ADD CONSTRAINT "payout_ledger_refund_request_id_fkey"
  FOREIGN KEY ("refund_request_id") REFERENCES "payment_refund_requests"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "payment_refund_requests" ENABLE ROW LEVEL SECURITY;

DO $roles$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'service_role') THEN
    EXECUTE 'GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE "payment_refund_requests" TO service_role';
    EXECUTE $policy$
      CREATE POLICY "foodflow_payment_refund_requests_service_role_all"
        ON "payment_refund_requests"
        FOR ALL
        TO service_role
        USING (true)
        WITH CHECK (true)
    $policy$;
  END IF;
END
$roles$;
