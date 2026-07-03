CREATE TABLE "driver_bank_accounts" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "driver_id" UUID NOT NULL,
  "bank_code" VARCHAR(32) NOT NULL,
  "bank_name" VARCHAR(160) NOT NULL,
  "account_number" VARCHAR(64) NOT NULL,
  "account_holder_name" VARCHAR(160) NOT NULL,
  "is_default" BOOLEAN NOT NULL DEFAULT false,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "driver_bank_accounts_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "driver_bank_accounts_driver_id_fkey" FOREIGN KEY ("driver_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "driver_bank_accounts_driver_bank_number_key"
  ON "driver_bank_accounts"("driver_id", "bank_code", "account_number");

CREATE INDEX "driver_bank_accounts_driver_default_idx"
  ON "driver_bank_accounts"("driver_id", "is_default");

CREATE UNIQUE INDEX "driver_bank_accounts_one_default_per_driver_idx"
  ON "driver_bank_accounts"("driver_id")
  WHERE "is_default" = true;
