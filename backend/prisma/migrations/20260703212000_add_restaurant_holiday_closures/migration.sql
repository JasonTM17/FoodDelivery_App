CREATE TABLE "restaurant_holiday_closures" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "restaurant_id" UUID NOT NULL,
  "date" DATE NOT NULL,
  "reason" VARCHAR(200),
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "restaurant_holiday_closures_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "restaurant_holiday_closures_restaurant_id_fkey" FOREIGN KEY ("restaurant_id") REFERENCES "restaurants"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "restaurant_holiday_closures_restaurant_date_key"
  ON "restaurant_holiday_closures"("restaurant_id", "date");

CREATE INDEX "restaurant_holiday_closures_restaurant_date_idx"
  ON "restaurant_holiday_closures"("restaurant_id", "date");

COMMENT ON TABLE "restaurant_holiday_closures" IS 'Restaurant-owned calendar dates when regular weekly opening hours are overridden by a full-day closure.';
COMMENT ON COLUMN "restaurant_holiday_closures"."date" IS 'Local business date for the closure, stored as DATE without time.';
