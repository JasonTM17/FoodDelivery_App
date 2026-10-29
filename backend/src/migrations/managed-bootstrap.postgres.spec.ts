import { execFile } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdtemp, mkdir, writeFile, copyFile, rm, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { promisify } from 'node:util';
import { PrismaClient } from '@prisma/client';
import { wrapAsSingleStatement, assertKycPostconditions, EXPECTED_BROADCAST_PREDICATE, EXPECTED_STORAGE_PREDICATE } from './managed-bootstrap';

/**
 * Real disposable-PostgreSQL regression for the managed bootstrap transport
 * and Prisma CLI mechanics. Skipped unless FOODFLOW_MIGRATION_TEST_DATABASE_URL
 * points at a throwaway database — never a shared or provider database.
 */
const url = process.env.FOODFLOW_MIGRATION_TEST_DATABASE_URL;
if (url && !['localhost', '127.0.0.1', '[::1]'].includes(new URL(url).hostname)) {
  throw new Error('Migration regression requires an isolated loopback PostgreSQL database');
}
const describePg = url ? describe : describe.skip;
const execFileAsync = promisify(execFile);
const prismaCli = join(process.cwd(), 'node_modules', 'prisma', 'build', 'index.js');

async function runPrismaCli(args: string[], cwd: string) {
  return execFileAsync(process.execPath, [prismaCli, ...args], {
    cwd,
    env: { ...process.env, DATABASE_URL: url, DIRECT_URL: url },
  });
}

describePg('managed bootstrap on real PostgreSQL', () => {
  jest.setTimeout(90_000);
  let prisma: PrismaClient;

  beforeEach(async () => {
    prisma = new PrismaClient({ datasourceUrl: url });
    await prisma.$executeRawUnsafe(
      'DROP TABLE IF EXISTS mb_probe_a, mb_probe_b, mb_probe_c, mb_probe_d, mb_probe_e CASCADE',
    );
  });

  afterEach(async () => {
    await prisma.$disconnect();
  });

  it('rejects a naive multi-statement batch through $executeRawUnsafe', async () => {
    await expect(
      prisma.$executeRawUnsafe('CREATE TABLE mb_probe_a (id int); CREATE TABLE mb_probe_b (id int);'),
    ).rejects.toThrow();
    const rows = await prisma.$queryRawUnsafe<Array<{ t: string | null }>>(
      `SELECT to_regclass('mb_probe_a')::text AS t`,
    );
    expect(rows[0].t).toBeNull();
  });

  it('executes a multi-command batch as one collision-checked DO/EXECUTE statement', async () => {
    const batch = [
      'CREATE TABLE mb_probe_c (id int);',
      // canonical-style nested dollar-quoted DO block inside the payload
      `DO $roles$\nBEGIN\n  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'postgres') THEN\n    EXECUTE $policy$ CREATE TABLE mb_probe_d (id int) $policy$;\n  END IF;\nEND\n$roles$;`,
      'CREATE TABLE mb_probe_e (id int);',
    ].join('\n');
    const transport = wrapAsSingleStatement(batch);
    expect(transport).toContain('EXECUTE $mb_exec$');
    await prisma.$transaction(async (tx) => {
      await tx.$executeRawUnsafe(transport);
    });
    const rows = await prisma.$queryRawUnsafe<
      Array<{ c: string | null; d: string | null; e: string | null }>
    >(
      `SELECT to_regclass('mb_probe_c')::text c, to_regclass('mb_probe_d')::text d, to_regclass('mb_probe_e')::text e`,
    );
    expect(rows[0]).toEqual({ c: 'mb_probe_c', d: 'mb_probe_d', e: 'mb_probe_e' });
  });

  it('rolls back the whole batch on late failure inside a transaction, then retries cleanly', async () => {
    const failing = wrapAsSingleStatement(
      'CREATE TABLE mb_probe_a (id int);\nSELECT mb_missing_fn();',
    );
    await expect(
      prisma.$transaction(async (tx) => {
        await tx.$executeRawUnsafe(failing);
      }),
    ).rejects.toThrow();
    const rows = await prisma.$queryRawUnsafe<Array<{ t: string | null }>>(
      `SELECT to_regclass('mb_probe_a')::text AS t`,
    );
    expect(rows[0].t).toBeNull();

    const retry = wrapAsSingleStatement('CREATE TABLE mb_probe_a (id int);');
    await prisma.$transaction(async (tx) => {
      await tx.$executeRawUnsafe(retry);
    });
    const after = await prisma.$queryRawUnsafe<Array<{ t: string | null }>>(
      `SELECT to_regclass('mb_probe_a')::text AS t`,
    );
    expect(after[0].t).toBe('mb_probe_a');
  });

  it('matches complete catalog-deparsed canonical policy predicates', async () => {
    await prisma.$executeRawUnsafe(wrapAsSingleStatement(`
      CREATE SCHEMA IF NOT EXISTS realtime;
      CREATE SCHEMA IF NOT EXISTS auth;
      CREATE SCHEMA IF NOT EXISTS storage;
      DO $roles$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname='authenticated') THEN CREATE ROLE authenticated; END IF;
        IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname='anon') THEN CREATE ROLE anon; END IF;
      END $roles$;
      CREATE OR REPLACE FUNCTION realtime.topic() RETURNS text LANGUAGE sql AS 'SELECT ''''::text';
      CREATE OR REPLACE FUNCTION auth.jwt() RETURNS jsonb LANGUAGE sql AS 'SELECT ''{}''::jsonb';
      CREATE TABLE IF NOT EXISTS realtime.messages (extension text);
      CREATE TABLE IF NOT EXISTS storage.objects (bucket_id text);
      DROP POLICY IF EXISTS "public can read published foodflow media" ON storage.objects;
      CREATE POLICY "public can read published foodflow media" ON storage.objects FOR SELECT TO anon,authenticated USING (bucket_id = 'foodflow-public');
    `));
    const canonical = await readFile(join(process.cwd(), 'prisma/migrations/20260712161000_authorize_private_broadcast_and_split_storage/migration.sql'), 'utf8');
    await prisma.$executeRawUnsafe(wrapAsSingleStatement(canonical.split('-- Retain the former outbox')[0]));
    const policies = await prisma.$queryRawUnsafe<Array<{ schemaname: string; qual: string }>>(
      `SELECT schemaname::text, qual::text FROM pg_policies WHERE (schemaname='realtime' AND policyname='foodflow scoped broadcast receive') OR (schemaname='storage' AND policyname='public can read published foodflow media')`,
    );
    const compact = (value: string) => value.replace(/\s+/g, '');
    expect(compact(policies.find((p) => p.schemaname === 'realtime')!.qual)).toBe(compact(EXPECTED_BROADCAST_PREDICATE));
    expect(compact(policies.find((p) => p.schemaname === 'storage')!.qual)).toBe(compact(EXPECTED_STORAGE_PREDICATE));
  });

  it('rejects the composite KYC index that permits duplicate pending submissions', async () => {
    try {
      await prisma.$executeRawUnsafe(wrapAsSingleStatement(`
        CREATE TYPE "KycStatus" AS ENUM ('pending','approved');
        CREATE TABLE driver_kyc_submissions (id int PRIMARY KEY, driver_profile_id int, status "KycStatus");
        ALTER TABLE driver_kyc_submissions ENABLE ROW LEVEL SECURITY;
        CREATE UNIQUE INDEX driver_kyc_one_pending_per_profile_idx ON driver_kyc_submissions(driver_profile_id,id) WHERE status='pending';
        INSERT INTO driver_kyc_submissions VALUES (1,7,'pending'),(2,7,'pending');
      `));
      const count = await prisma.$queryRawUnsafe<Array<{ n: number }>>('SELECT count(*)::int n FROM driver_kyc_submissions');
      expect(count[0].n).toBe(2);
      await expect(assertKycPostconditions(prisma)).rejects.toThrow('key/predicate drifted');
      await prisma.$executeRawUnsafe(wrapAsSingleStatement(`
        TRUNCATE driver_kyc_submissions;
        DROP INDEX driver_kyc_one_pending_per_profile_idx;
        CREATE UNIQUE INDEX driver_kyc_one_pending_per_profile_idx ON driver_kyc_submissions(driver_profile_id) WHERE status='pending';
      `));
      await expect(assertKycPostconditions(prisma)).resolves.toBeUndefined();
      await prisma.$executeRawUnsafe("INSERT INTO driver_kyc_submissions VALUES (1,7,'pending')");
      await expect(prisma.$executeRawUnsafe("INSERT INTO driver_kyc_submissions VALUES (2,7,'pending')")).rejects.toThrow();
    } finally {
      await prisma.$executeRawUnsafe(wrapAsSingleStatement('DROP TABLE IF EXISTS driver_kyc_submissions CASCADE; DROP TYPE IF EXISTS "KycStatus";'));
    }
  });

  it('records canonical checksum via resolve --applied on a never-attempted migration and deploys around the gap', async () => {
    const root = await mkdtemp(join(tmpdir(), 'ff-mb-pg-'));
    try {
      const mkMig = async (name: string, sql: string) => {
        const dir = join(root, 'prisma', 'migrations', name);
        await mkdir(dir, { recursive: true });
        await writeFile(join(dir, 'migration.sql'), sql);
      };
      await mkdir(join(root, 'prisma'), { recursive: true });
      await copyFile(
        join(process.cwd(), 'prisma', 'schema.prisma'),
        join(root, 'prisma', 'schema.prisma'),
      );
      await mkMig('20260101000000_first', 'CREATE TABLE mb_t1 (id int PRIMARY KEY);');
      await mkMig('20260102000000_skipped', 'CREATE TABLE mb_t2 (id int PRIMARY KEY);');
      await mkMig('20260103000000_third', 'CREATE TABLE mb_t3 (id int PRIMARY KEY);');

      // subset deploy: only first — mirrors the provider-dir exclusion
      const sub = join(root, 'prefix');
      await mkdir(join(sub, 'migrations', '20260101000000_first'), { recursive: true });
      await copyFile(join(root, 'prisma', 'schema.prisma'), join(sub, 'schema.prisma'));
      await copyFile(
        join(root, 'prisma', 'migrations', '20260101000000_first', 'migration.sql'),
        join(sub, 'migrations', '20260101000000_first', 'migration.sql'),
      );
      await runPrismaCli(['migrate', 'deploy', '--schema', 'schema.prisma'], sub);

      // resolve --applied on the never-attempted middle migration
      await runPrismaCli(
        ['migrate', 'resolve', '--applied', '20260102000000_skipped', '--schema', 'prisma/schema.prisma'],
        root,
      );

      const rows = await prisma.$queryRawUnsafe<
        Array<{ migration_name: string; checksum: string; fin: boolean }>
      >(
        `SELECT migration_name, checksum, finished_at IS NOT NULL AS fin
         FROM "_prisma_migrations" ORDER BY started_at ASC`,
      );
      const skipped = rows.find((r) => r.migration_name === '20260102000000_skipped');
      expect(skipped?.fin).toBe(true);
      const fileBytes = await readFile(
        join(root, 'prisma', 'migrations', '20260102000000_skipped', 'migration.sql'),
        'utf8',
      );
      // Prisma records the canonical sha256 of the on-disk migration bytes
      expect(skipped?.checksum).toBe(
        createHash('sha256').update(fileBytes).digest('hex'),
      );

      // later non-provider migration still deploys after the resolved gap
      const tail = join(root, 'tail');
      await mkdir(join(tail, 'migrations', '20260103000000_third'), { recursive: true });
      await copyFile(join(root, 'prisma', 'schema.prisma'), join(tail, 'schema.prisma'));
      await copyFile(
        join(root, 'prisma', 'migrations', '20260103000000_third', 'migration.sql'),
        join(tail, 'migrations', '20260103000000_third', 'migration.sql'),
      );
      await runPrismaCli(['migrate', 'deploy', '--schema', 'schema.prisma'], tail);
      const finalRows = await prisma.$queryRawUnsafe<Array<{ t: string | null }>>(
        `SELECT to_regclass('mb_t3')::text AS t`,
      );
      expect(finalRows[0].t).toBe('mb_t3');
    } finally {
      await rm(root, { recursive: true, force: true, maxRetries: 10, retryDelay: 250 });
    }
  });
});
