-- FoodFlow private Broadcast authorization. Clients can only join topics that
-- the API placed in their short-lived ES256 JWT. Clients receive only; all
-- business-event publishing happens server-side with SUPABASE_SECRET_KEY.
DO $$
BEGIN
  IF to_regclass('realtime.messages') IS NOT NULL THEN
    ALTER TABLE realtime.messages ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "foodflow scoped broadcast receive" ON realtime.messages;
    CREATE POLICY "foodflow scoped broadcast receive"
      ON realtime.messages
      FOR SELECT
      TO authenticated
      USING (
        realtime.messages.extension = 'broadcast'
        AND (SELECT realtime.topic()) IN (
          SELECT jsonb_array_elements_text(
            COALESCE((SELECT auth.jwt()) -> 'realtime_channels', '[]'::jsonb)
          )
        )
      );
  END IF;
END
$$;

-- Retain the former outbox for one rollback cycle, but remove public/client
-- access and stop exposing new rows through Postgres Changes.
ALTER TABLE IF EXISTS public.realtime_outbox ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF to_regclass('public.realtime_outbox') IS NOT NULL THEN
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
      REVOKE ALL ON TABLE public.realtime_outbox FROM anon;
    END IF;
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
      REVOKE ALL ON TABLE public.realtime_outbox FROM authenticated;
    END IF;
  END IF;
END
$$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'realtime_outbox'
  ) THEN
    ALTER PUBLICATION supabase_realtime DROP TABLE public.realtime_outbox;
  END IF;
END
$$;

-- Supabase Storage is absent in a plain PostgreSQL test database, so all
-- provider-owned objects are guarded while still applying on linked projects.
DO $$
BEGIN
  IF to_regclass('storage.buckets') IS NOT NULL THEN
    INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
    VALUES
      (
        'foodflow-public',
        'foodflow-public',
        true,
        5242880,
        ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/avif']
      ),
      (
        'foodflow-private',
        'foodflow-private',
        false,
        4194304,
        ARRAY['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
      )
    ON CONFLICT (id) DO UPDATE SET
      public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

    DROP POLICY IF EXISTS "public can read published foodflow media" ON storage.objects;
    CREATE POLICY "public can read published foodflow media"
      ON storage.objects
      FOR SELECT
      TO anon, authenticated
      USING (bucket_id = 'foodflow-public');
  END IF;
END
$$;
