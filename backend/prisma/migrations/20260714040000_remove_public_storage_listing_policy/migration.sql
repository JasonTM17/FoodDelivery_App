-- Public Supabase buckets serve object URLs without a SELECT policy. Keeping
-- this policy would let anon/authenticated clients enumerate every object key.
-- Storage is provider-owned and absent from plain PostgreSQL test databases.
DO $$
BEGIN
  IF to_regclass('storage.objects') IS NOT NULL THEN
    DROP POLICY IF EXISTS "public can read published foodflow media"
      ON storage.objects;
  END IF;
END
$$;
