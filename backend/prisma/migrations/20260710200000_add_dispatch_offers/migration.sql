CREATE TABLE "dispatch_offers" (
  "id" UUID NOT NULL,
  "order_id" UUID NOT NULL,
  "driver_id" UUID NOT NULL,
  "token_hash" CHAR(64) NOT NULL,
  "status" VARCHAR(20) NOT NULL DEFAULT 'pending',
  "attempt" SMALLINT NOT NULL,
  "restaurant_lat" DOUBLE PRECISION NOT NULL,
  "restaurant_lng" DOUBLE PRECISION NOT NULL,
  "distance_km" DOUBLE PRECISION NOT NULL,
  "driver_rating" DOUBLE PRECISION NOT NULL,
  "total_deliveries" INTEGER NOT NULL,
  "surge_multiplier" DOUBLE PRECISION NOT NULL,
  "expires_at" TIMESTAMPTZ NOT NULL,
  "responded_at" TIMESTAMPTZ,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ NOT NULL,
  CONSTRAINT "dispatch_offers_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "dispatch_offers_status_check" CHECK ("status" IN ('pending', 'accepted', 'rejected', 'expired', 'assigned', 'failed')),
  CONSTRAINT "dispatch_offers_attempt_check" CHECK ("attempt" BETWEEN 1 AND 20),
  CONSTRAINT "dispatch_offers_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "dispatch_offers_driver_id_fkey" FOREIGN KEY ("driver_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "dispatch_offers_order_id_status_idx"
  ON "dispatch_offers"("order_id", "status");

CREATE INDEX "dispatch_offers_driver_id_status_expires_at_idx"
  ON "dispatch_offers"("driver_id", "status", "expires_at");

CREATE UNIQUE INDEX "dispatch_offers_one_active_per_order_idx"
  ON "dispatch_offers"("order_id")
  WHERE "status" IN ('pending', 'accepted');

ALTER TABLE "dispatch_offers" ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE "dispatch_offers" IS
  'Server-only dispatch offer state. No direct browser or mobile RLS policy is granted.';
