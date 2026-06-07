-- Promotions engine: enum extension + new columns
-- NOTE: ALTER TYPE ... ADD VALUE cannot run inside a Postgres transaction block.
-- Prisma will execute this migration outside a transaction automatically.

-- Add free_delivery promotion type
ALTER TYPE "PromotionType" ADD VALUE IF NOT EXISTS 'free_delivery';

-- Denormalized usage counter for atomic FOR-UPDATE claim path
ALTER TABLE "promotions"
  ADD COLUMN IF NOT EXISTS "current_usage_count" INTEGER NOT NULL DEFAULT 0;

-- Per-user cap (null = single use enforced by unique constraint on promotion_usages)
ALTER TABLE "promotions"
  ADD COLUMN IF NOT EXISTS "max_per_user" INTEGER;

-- First-order-only restriction
ALTER TABLE "promotions"
  ADD COLUMN IF NOT EXISTS "first_order_only" BOOLEAN NOT NULL DEFAULT false;

-- Optional restaurant-level restriction (null = applies to all restaurants)
ALTER TABLE "promotions"
  ADD COLUMN IF NOT EXISTS "restaurant_id" UUID;

-- Seed counter from existing usage records
UPDATE "promotions" p
SET "current_usage_count" = (
  SELECT COUNT(*)::INTEGER
  FROM "promotion_usages" pu
  WHERE pu.promotion_id = p.id
);

-- Index for restaurant-scoped promo lookups
CREATE INDEX IF NOT EXISTS "promotions_restaurant_id_idx"
  ON "promotions"("restaurant_id");
