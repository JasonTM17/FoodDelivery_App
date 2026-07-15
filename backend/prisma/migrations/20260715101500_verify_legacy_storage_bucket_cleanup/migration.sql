-- The Supabase Storage API removes the legacy buckets before Prisma runs.
-- Keep database migration history forward-only and verify the required state.
DO $$
DECLARE
  has_legacy_buckets boolean;
BEGIN
  IF to_regclass('storage.buckets') IS NULL THEN
    RETURN;
  END IF;

  EXECUTE $query$
    SELECT EXISTS (
      SELECT 1 FROM storage.buckets
      WHERE id IN ('foodflow-kyc', 'foodflow-production')
    )
  $query$ INTO has_legacy_buckets;

  IF has_legacy_buckets THEN
    RAISE EXCEPTION 'legacy Supabase Storage bucket cleanup did not complete';
  END IF;
END
$$;
