-- Application data is accessed through the Nest API. Browser roles use only
-- separately scoped Realtime/Storage policies, never application table reads.
-- Exclude extension-owned tables such as PostGIS spatial_ref_sys.
DO $app_tables$
DECLARE
  relation record;
BEGIN
  FOR relation IN
    SELECT c.oid, n.nspname, c.relname
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public'
      AND c.relkind = 'r'
      AND c.relname <> '_prisma_migrations'
      AND NOT EXISTS (
        SELECT 1 FROM pg_depend d
        WHERE d.classid = 'pg_class'::regclass
          AND d.objid = c.oid AND d.deptype = 'e'
      )
  LOOP
    EXECUTE format('ALTER TABLE %I.%I ENABLE ROW LEVEL SECURITY', relation.nspname, relation.relname);
    EXECUTE format('REVOKE ALL ON TABLE %I.%I FROM PUBLIC', relation.nspname, relation.relname);
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
      EXECUTE format('REVOKE ALL ON TABLE %I.%I FROM anon', relation.nspname, relation.relname);
    END IF;
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
      EXECUTE format('REVOKE ALL ON TABLE %I.%I FROM authenticated', relation.nspname, relation.relname);
    END IF;
  END LOOP;
END
$app_tables$;
