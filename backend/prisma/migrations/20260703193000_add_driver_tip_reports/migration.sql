CREATE TABLE "driver_tip_reports" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "order_id" UUID NOT NULL,
  "driver_id" UUID NOT NULL,
  "amount" INTEGER NOT NULL,
  "currency" VARCHAR(3) NOT NULL DEFAULT 'VND',
  "status" VARCHAR(20) NOT NULL DEFAULT 'reported',
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "driver_tip_reports_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "driver_tip_reports_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "driver_tip_reports_driver_id_fkey" FOREIGN KEY ("driver_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "driver_tip_reports_amount_positive" CHECK ("amount" > 0)
);

CREATE UNIQUE INDEX "driver_tip_reports_order_driver_key"
  ON "driver_tip_reports"("order_id", "driver_id");

CREATE INDEX "driver_tip_reports_driver_created_idx"
  ON "driver_tip_reports"("driver_id", "created_at" DESC);
