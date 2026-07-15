-- Remove the pre-split Storage buckets after the rollback grace period.
-- Fail closed if any legacy bucket still contains data or an active upload.
DO $$
DECLARE
  legacy_bucket text;
BEGIN
  IF to_regclass('storage.buckets') IS NULL THEN
    RETURN;
  END IF;

  -- Storage does not declare bucket foreign keys for every dependent table.
  -- Block concurrent writes during the emptiness check and bucket deletion.
  EXECUTE 'LOCK TABLE storage.buckets IN SHARE ROW EXCLUSIVE MODE';
  IF to_regclass('storage.objects') IS NOT NULL THEN
    EXECUTE 'LOCK TABLE storage.objects IN SHARE ROW EXCLUSIVE MODE';
  END IF;
  IF to_regclass('storage.s3_multipart_uploads') IS NOT NULL THEN
    EXECUTE 'LOCK TABLE storage.s3_multipart_uploads IN SHARE ROW EXCLUSIVE MODE';
  END IF;
  IF to_regclass('storage.vector_indexes') IS NOT NULL THEN
    EXECUTE 'LOCK TABLE storage.vector_indexes IN SHARE ROW EXCLUSIVE MODE';
  END IF;

  FOREACH legacy_bucket IN ARRAY ARRAY['foodflow-kyc', 'foodflow-production']
  LOOP
    IF to_regclass('storage.objects') IS NOT NULL
      AND EXISTS (
        SELECT 1
        FROM storage.objects
        WHERE bucket_id = legacy_bucket
      )
    THEN
      RAISE EXCEPTION 'legacy Storage bucket % is not empty', legacy_bucket;
    END IF;

    IF to_regclass('storage.s3_multipart_uploads') IS NOT NULL
      AND EXISTS (
        SELECT 1
        FROM storage.s3_multipart_uploads
        WHERE bucket_id = legacy_bucket
      )
    THEN
      RAISE EXCEPTION 'legacy Storage bucket % has active multipart uploads', legacy_bucket;
    END IF;

    IF to_regclass('storage.vector_indexes') IS NOT NULL
      AND EXISTS (
        SELECT 1
        FROM storage.vector_indexes
        WHERE bucket_id = legacy_bucket
      )
    THEN
      RAISE EXCEPTION 'legacy Storage bucket % has vector indexes', legacy_bucket;
    END IF;
  END LOOP;

  DELETE FROM storage.buckets
  WHERE id IN ('foodflow-kyc', 'foodflow-production');
END
$$;
