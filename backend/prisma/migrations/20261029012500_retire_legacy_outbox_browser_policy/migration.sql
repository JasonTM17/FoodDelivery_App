-- Private Broadcast supersedes browser reads of the retained rollback outbox.
-- Remove the historical policy so a future accidental table grant cannot
-- reactivate direct access. Provider realtime.messages policies are unchanged.
DO $legacy_outbox$
BEGIN
  IF to_regclass('public.realtime_outbox') IS NOT NULL THEN
    DROP POLICY IF EXISTS foodflow_realtime_outbox_read_allowed_channels
      ON public.realtime_outbox;
  END IF;
END
$legacy_outbox$;
