-- CreateTable: loyalty_transactions
CREATE TABLE IF NOT EXISTS "loyalty_transactions" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "user_id" UUID NOT NULL,
  "points" INTEGER NOT NULL,
  "type" VARCHAR(10) NOT NULL DEFAULT 'credit',
  "description" TEXT NOT NULL DEFAULT '',
  "order_id" UUID,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT "loyalty_transactions_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "loyalty_transactions_type_check" CHECK ("type" IN ('credit', 'debit'))
);

CREATE INDEX IF NOT EXISTS "loyalty_transactions_user_id_idx"
  ON "loyalty_transactions" ("user_id");

CREATE INDEX IF NOT EXISTS "loyalty_transactions_user_id_created_at_idx"
  ON "loyalty_transactions" ("user_id", "created_at" DESC);

ALTER TABLE "loyalty_transactions"
  ADD CONSTRAINT "loyalty_transactions_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "users"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
