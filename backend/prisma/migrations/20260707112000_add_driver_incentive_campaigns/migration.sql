CREATE TABLE "driver_incentive_campaigns" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "title" VARCHAR(150) NOT NULL,
    "reward_amount" INTEGER NOT NULL,
    "target_orders" INTEGER NOT NULL,
    "starts_at" TIMESTAMPTZ NOT NULL,
    "ends_at" TIMESTAMPTZ NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "driver_incentive_campaigns_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "driver_incentive_campaigns_reward_amount_check" CHECK ("reward_amount" >= 0),
    CONSTRAINT "driver_incentive_campaigns_target_orders_check" CHECK ("target_orders" > 0),
    CONSTRAINT "driver_incentive_campaigns_window_check" CHECK ("ends_at" > "starts_at")
);

CREATE INDEX "driver_incentive_campaigns_is_active_starts_at_ends_at_idx"
    ON "driver_incentive_campaigns"("is_active", "starts_at", "ends_at");
