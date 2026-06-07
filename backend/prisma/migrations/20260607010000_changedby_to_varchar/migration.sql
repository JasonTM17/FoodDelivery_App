-- AlterTable
ALTER TABLE "order_status_history"
  ALTER COLUMN "changed_by" TYPE VARCHAR(50)
  USING "changed_by"::text;
