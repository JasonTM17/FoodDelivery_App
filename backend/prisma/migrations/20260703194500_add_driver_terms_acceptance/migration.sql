ALTER TABLE "driver_profiles"
  ADD COLUMN "terms_accepted_at" TIMESTAMPTZ,
  ADD COLUMN "terms_version" VARCHAR(32);

CREATE INDEX "driver_profiles_terms_accepted_at_idx"
  ON "driver_profiles"("terms_accepted_at");
