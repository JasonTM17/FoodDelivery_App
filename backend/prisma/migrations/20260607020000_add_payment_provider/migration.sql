-- Extend PaymentMethod enum with SePay provider
ALTER TYPE "PaymentMethod" ADD VALUE IF NOT EXISTS 'sepay';

-- Add commission rate snapshot to orders
ALTER TABLE "orders" ADD COLUMN "commission_rate_at_order_time" DECIMAL(4,2) NOT NULL DEFAULT 15.0;

-- Create payment_intents table for VietQR / SePay flow
CREATE TABLE "payment_intents" (
  "id"              UUID         NOT NULL DEFAULT gen_random_uuid(),
  "order_id"        UUID         NOT NULL,
  "provider"        VARCHAR(20)  NOT NULL,
  "transaction_ref" VARCHAR(100) NOT NULL,
  "qr_code_url"     TEXT,
  "amount"          INTEGER      NOT NULL,
  "status"          VARCHAR(20)  NOT NULL DEFAULT 'pending',
  "expires_at"      TIMESTAMPTZ  NOT NULL,
  "created_at"      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),

  CONSTRAINT "payment_intents_pkey"            PRIMARY KEY ("id"),
  CONSTRAINT "payment_intents_order_id_key"    UNIQUE ("order_id"),
  CONSTRAINT "payment_intents_transaction_ref_key" UNIQUE ("transaction_ref"),
  CONSTRAINT "payment_intents_order_id_fkey"   FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- Create payout_ledger table for commission tracking
CREATE TABLE "payout_ledger" (
  "id"                   UUID         NOT NULL DEFAULT gen_random_uuid(),
  "order_id"             UUID         NOT NULL,
  "recipient_type"       VARCHAR(20)  NOT NULL,
  "recipient_id"         UUID,
  "amount"               INTEGER      NOT NULL,
  "currency"             VARCHAR(3)   NOT NULL DEFAULT 'VND',
  "status"               VARCHAR(20)  NOT NULL DEFAULT 'pending',
  "settlement_batch_id"  UUID,
  "created_at"           TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  "settled_at"           TIMESTAMPTZ,

  CONSTRAINT "payout_ledger_pkey"        PRIMARY KEY ("id"),
  CONSTRAINT "payout_ledger_order_fkey"  FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE INDEX "payment_intents_order_id_idx"              ON "payment_intents"("order_id");
CREATE INDEX "payout_ledger_order_id_idx"                ON "payout_ledger"("order_id");
CREATE INDEX "payout_ledger_recipient_type_id_status_idx" ON "payout_ledger"("recipient_type", "recipient_id", "status");
