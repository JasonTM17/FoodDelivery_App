BEGIN;

-- Keep the semantic FK rollout atomic. A late orphan must not leave earlier DDL applied.

CREATE TABLE "production_role_smoke_runs" (
  "run_id" VARCHAR(32) NOT NULL,
  "restaurant_id" UUID NOT NULL,
  "restaurant_slug" VARCHAR(200) NOT NULL,
  "admin_user_id" UUID NOT NULL,
  "restaurant_user_id" UUID NOT NULL,
  "customer_user_id" UUID NOT NULL,
  "driver_user_id" UUID NOT NULL,
  "state" VARCHAR(32) NOT NULL DEFAULT 'active',
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "deletion_committed_at" TIMESTAMPTZ,
  "capability_drain_done_at" TIMESTAMPTZ,

  CONSTRAINT "production_role_smoke_runs_pkey" PRIMARY KEY ("run_id"),
  CONSTRAINT "production_role_smoke_runs_state_check"
    CHECK ("state" IN ('active', 'deletion_committed', 'complete'))
);

-- The table is operational recovery metadata, not a Data API contract.
ALTER TABLE "production_role_smoke_runs" ENABLE ROW LEVEL SECURITY;

-- Give operators a table-specific failure before any FK or index is installed.
DO $migration$
DECLARE
  orphan_count BIGINT;
BEGIN
  SELECT COUNT(*) INTO orphan_count
  FROM "restaurants" child
  LEFT JOIN "users" parent ON parent."id" = child."approved_by_id"
  WHERE child."approved_by_id" IS NOT NULL AND parent."id" IS NULL;
  IF orphan_count > 0 THEN
    RAISE EXCEPTION 'restaurants.approved_by_id has % orphan row(s)', orphan_count;
  END IF;

  SELECT COUNT(*) INTO orphan_count
  FROM "carts" child
  LEFT JOIN "restaurants" parent ON parent."id" = child."restaurant_id"
  WHERE child."restaurant_id" IS NOT NULL AND parent."id" IS NULL;
  IF orphan_count > 0 THEN
    RAISE EXCEPTION 'carts.restaurant_id has % orphan row(s)', orphan_count;
  END IF;

  SELECT COUNT(*) INTO orphan_count
  FROM "promotions" child
  LEFT JOIN "users" parent ON parent."id" = child."created_by_id"
  WHERE child."created_by_id" IS NOT NULL AND parent."id" IS NULL;
  IF orphan_count > 0 THEN
    RAISE EXCEPTION 'promotions.created_by_id has % orphan row(s)', orphan_count;
  END IF;

  SELECT COUNT(*) INTO orphan_count
  FROM "chat_messages" child
  LEFT JOIN "users" parent ON parent."id" = child."sender_id"
  WHERE child."sender_id" IS NOT NULL AND parent."id" IS NULL;
  IF orphan_count > 0 THEN
    RAISE EXCEPTION 'chat_messages.sender_id has % orphan row(s)', orphan_count;
  END IF;

  SELECT COUNT(*) INTO orphan_count
  FROM "support_macros" child
  LEFT JOIN "users" parent ON parent."id" = child."created_by_id"
  WHERE parent."id" IS NULL;
  IF orphan_count > 0 THEN
    RAISE EXCEPTION 'support_macros.created_by_id has % orphan row(s)', orphan_count;
  END IF;

  SELECT COUNT(*) INTO orphan_count
  FROM "support_csat_responses" child
  LEFT JOIN "users" parent ON parent."id" = child."user_id"
  WHERE parent."id" IS NULL;
  IF orphan_count > 0 THEN
    RAISE EXCEPTION 'support_csat_responses.user_id has % orphan row(s)', orphan_count;
  END IF;
END
$migration$;

ALTER TABLE "restaurants"
  ADD CONSTRAINT "restaurants_approved_by_id_fkey"
  FOREIGN KEY ("approved_by_id") REFERENCES "users"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "carts"
  ADD CONSTRAINT "carts_restaurant_id_fkey"
  FOREIGN KEY ("restaurant_id") REFERENCES "restaurants"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "promotions"
  ADD CONSTRAINT "promotions_created_by_id_fkey"
  FOREIGN KEY ("created_by_id") REFERENCES "users"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "chat_messages"
  ADD CONSTRAINT "chat_messages_sender_id_fkey"
  FOREIGN KEY ("sender_id") REFERENCES "users"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "support_macros"
  ADD CONSTRAINT "support_macros_created_by_id_fkey"
  FOREIGN KEY ("created_by_id") REFERENCES "users"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "support_csat_responses"
  ADD CONSTRAINT "support_csat_responses_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "users"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE INDEX "production_role_smoke_runs_state_created_at_idx"
  ON "production_role_smoke_runs"("state", "created_at");
CREATE INDEX "restaurants_approved_by_id_idx" ON "restaurants"("approved_by_id");
CREATE INDEX "carts_restaurant_id_idx" ON "carts"("restaurant_id");
CREATE INDEX "promotions_created_by_id_idx" ON "promotions"("created_by_id");
CREATE INDEX "chat_messages_sender_id_idx" ON "chat_messages"("sender_id");
CREATE INDEX "support_macros_created_by_id_idx" ON "support_macros"("created_by_id");
CREATE INDEX "support_csat_responses_user_id_idx" ON "support_csat_responses"("user_id");

COMMIT;
