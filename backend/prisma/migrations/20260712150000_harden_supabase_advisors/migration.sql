DO $functions$
DECLARE
  signature text;
BEGIN
  FOREACH signature IN ARRAY ARRAY[
    'public.rls_auto_enable()'
  ]
  LOOP
    IF to_regprocedure(signature) IS NOT NULL THEN
      EXECUTE format('REVOKE EXECUTE ON FUNCTION %s FROM PUBLIC', signature);

      IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
        EXECUTE format('REVOKE EXECUTE ON FUNCTION %s FROM anon', signature);
      END IF;

      IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
        EXECUTE format('REVOKE EXECUTE ON FUNCTION %s FROM authenticated', signature);
      END IF;
    END IF;
  END LOOP;
END
$functions$;

DO $realtime_policy$
BEGIN
  IF to_regclass('public.realtime_outbox') IS NOT NULL
    AND EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
    DROP POLICY IF EXISTS "foodflow_realtime_outbox_read_allowed_channels"
      ON public.realtime_outbox;

    CREATE POLICY "foodflow_realtime_outbox_read_allowed_channels"
      ON public.realtime_outbox
      FOR SELECT
      TO authenticated
      USING (
        channel IN (
          SELECT jsonb_array_elements_text(
            COALESCE(
              (SELECT auth.jwt()) -> 'realtime_channels',
              '[]'::jsonb
            )
          )
        )
      );
  END IF;
END
$realtime_policy$;
