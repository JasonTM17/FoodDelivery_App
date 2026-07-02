-- Bring tables that predate tracked migrations in sync with the current
-- Prisma schema. Every change is additive or converts existing values in place.

DO $$ BEGIN
  CREATE TYPE "LoyaltyTxnType" AS ENUM ('credit', 'debit');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "WalletTxnType" AS ENUM ('credit', 'debit');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE "loyalty_transactions"
  DROP CONSTRAINT IF EXISTS "loyalty_transactions_type_check";
ALTER TABLE "loyalty_transactions"
  ALTER COLUMN "type" DROP DEFAULT,
  ALTER COLUMN "type" TYPE "LoyaltyTxnType"
    USING "type"::text::"LoyaltyTxnType",
  ALTER COLUMN "type" SET DEFAULT 'credit';

ALTER TABLE "wallet_transactions"
  DROP CONSTRAINT IF EXISTS "wallet_transactions_type_check";
ALTER TABLE "wallet_transactions"
  ALTER COLUMN "type" TYPE "WalletTxnType"
    USING "type"::text::"WalletTxnType",
  ADD COLUMN IF NOT EXISTS "status" VARCHAR(20) NOT NULL DEFAULT 'CONFIRMED';

ALTER TABLE "reviews"
  ADD COLUMN IF NOT EXISTS "hidden_reason" TEXT,
  ADD COLUMN IF NOT EXISTS "is_hidden" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "photos" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN IF NOT EXISTS "reply" TEXT,
  ADD COLUMN IF NOT EXISTS "reply_at" TIMESTAMPTZ,
  ALTER COLUMN "delivery_rating" DROP NOT NULL;

ALTER TABLE "user_fcm_tokens"
  ADD COLUMN IF NOT EXISTS "last_seen_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS "platform" VARCHAR(20);
UPDATE "user_fcm_tokens" SET "platform" = 'unknown' WHERE "platform" IS NULL;
ALTER TABLE "user_fcm_tokens" ALTER COLUMN "platform" SET NOT NULL;

CREATE TABLE IF NOT EXISTS "email_verification_tokens" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id" UUID NOT NULL REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  "token" VARCHAR(128) NOT NULL UNIQUE,
  "expires_at" TIMESTAMPTZ NOT NULL,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "password_reset_tokens" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id" UUID NOT NULL REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  "token" VARCHAR(128) NOT NULL UNIQUE,
  "expires_at" TIMESTAMPTZ NOT NULL,
  "used_at" TIMESTAMPTZ,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "idempotency_requests" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id" UUID,
  "idempotency_key" VARCHAR(64) NOT NULL,
  "status_code" INTEGER NOT NULL,
  "response_body" JSONB NOT NULL,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT NOW(),
  CONSTRAINT "idempotency_requests_user_id_idempotency_key_key"
    UNIQUE ("user_id", "idempotency_key")
);

CREATE INDEX IF NOT EXISTS "email_verification_tokens_token_idx"
  ON "email_verification_tokens"("token");
CREATE INDEX IF NOT EXISTS "email_verification_tokens_user_id_idx"
  ON "email_verification_tokens"("user_id");
CREATE INDEX IF NOT EXISTS "password_reset_tokens_token_idx"
  ON "password_reset_tokens"("token");
CREATE INDEX IF NOT EXISTS "password_reset_tokens_user_id_idx"
  ON "password_reset_tokens"("user_id");
CREATE INDEX IF NOT EXISTS "idempotency_requests_user_id_idx"
  ON "idempotency_requests"("user_id");
CREATE INDEX IF NOT EXISTS "idempotency_requests_created_at_idx"
  ON "idempotency_requests"("created_at");
CREATE INDEX IF NOT EXISTS "wallet_transactions_user_id_status_idx"
  ON "wallet_transactions"("user_id", "status");
