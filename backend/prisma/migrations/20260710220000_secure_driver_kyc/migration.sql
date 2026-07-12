CREATE UNIQUE INDEX IF NOT EXISTS "driver_kyc_one_pending_per_profile_idx"
  ON "driver_kyc_submissions"("driver_profile_id")
  WHERE "status" = 'pending';

ALTER TABLE "driver_kyc_submissions" ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE "driver_kyc_submissions" IS
  'Server-managed private driver identity review state. document_urls stores private object keys, never public URLs.';

DO $roles$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'service_role') THEN
    EXECUTE 'GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE "driver_kyc_submissions" TO service_role';
    IF NOT EXISTS (
      SELECT 1
      FROM pg_policies
      WHERE schemaname = 'public'
        AND tablename = 'driver_kyc_submissions'
        AND policyname = 'foodflow_driver_kyc_service_role_all'
    ) THEN
      EXECUTE $policy$
        CREATE POLICY "foodflow_driver_kyc_service_role_all"
          ON "driver_kyc_submissions"
          FOR ALL
          TO service_role
          USING (true)
          WITH CHECK (true)
      $policy$;
    END IF;
  END IF;
END
$roles$;

DO $storage$
BEGIN
  IF to_regclass('storage.buckets') IS NOT NULL THEN
    EXECUTE $bucket$
      INSERT INTO storage.buckets (
        id,
        name,
        public,
        file_size_limit,
        allowed_mime_types
      )
      VALUES (
        'foodflow-kyc',
        'foodflow-kyc',
        false,
        4194304,
        ARRAY['image/jpeg', 'image/png', 'image/webp']::text[]
      )
      ON CONFLICT (id) DO UPDATE SET
        public = false,
        file_size_limit = EXCLUDED.file_size_limit,
        allowed_mime_types = EXCLUDED.allowed_mime_types
    $bucket$;
  END IF;
END
$storage$;
