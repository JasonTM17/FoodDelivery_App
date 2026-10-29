import { spawn } from 'node:child_process';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import {
  copyFile as copyFileAsync,
  mkdir as mkdirAsync,
  mkdtemp as mkdtempAsync,
  readFile as readFileAsync,
  readdir as readdirAsync,
  rm as rmAsync,
} from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { PrismaClient } from '@prisma/client';
import { createClient } from '@supabase/supabase-js';
import { assertAppliedMigrationChecksums } from './migration-checksum-guard';
import { deleteEmptyLegacyBuckets, LEGACY_BUCKETS } from './production-migrate';

/**
 * Managed-provider bootstrap/recovery for canonical migrations (proactive mode).
 *
 * Hosted Supabase owns realtime/storage objects: `ALTER TABLE
 * realtime.messages ENABLE ROW LEVEL SECURITY` fails with 42501 (RLS is
 * already enabled) and bucket metadata must not be mutated through SQL.
 * Running `prisma migrate deploy` against the real migrations directory would
 * attempt those statements — and where a provider does allow them, deploy would
 * mutate Storage directly, bypassing the accepted API contract.
 *
 * This command therefore never lets `migrate deploy` see the four provider
 * migrations. For each one, in canonical order:
 *   1. A canonical-PREFIX checkpoint: `migrate deploy` runs against a temporary
 *      schema dir containing byte-identical copies of the non-provider
 *      migration directories that precede it, so every canonical predecessor
 *      is applied first.
 *   2. The provider migration's canonical checksum is verified against pinned
 *      SHA-256 variants, the provider-forbidden fragments are removed, and the
 *      remaining original statements execute as ONE statement inside a
 *      collision-checked `DO ... EXECUTE` wrapper in a single transaction
 *      (`$executeRawUnsafe` accepts a single statement only).
 *   3. Bucket operations run through the Supabase Storage API (existence via
 *      listBuckets inventory; getBucket is only used for detail).
 *   4. Effective postconditions are verified: exact policy inventory, outbox
 *      privilege revokes, publication removal, KYC index shape, bucket specs.
 *   5. Only then `prisma migrate resolve --applied` records the migration —
 *      with the canonical checksum Prisma computes from the real migration dir.
 *
 * A pre-existing failed/interrupted approved history row is handled first:
 * exactly one unfinished row, in the allowlist, with a recorded checksum in the
 * pinned canonical variants — anything else fails closed before mutation.
 *
 * Canonical migration.sql bytes are never modified or claimed to have run.
 */

type StorageError = { message: string } | null;

export type StorageBucketRecord = {
  id: string;
  public?: boolean | null;
  file_size_limit?: number | string | null;
  allowed_mime_types?: string[] | null;
};

export type ManagedStorageApi = {
  listBuckets(): Promise<{ data: Array<{ id: string }> | null; error: StorageError }>;
  getBucket(bucketId: string): Promise<{ data: StorageBucketRecord | null; error: StorageError }>;
  createBucket(bucketId: string, options: BucketSpec): Promise<{ data: unknown; error: StorageError }>;
  updateBucket(bucketId: string, options: BucketSpec): Promise<{ data: unknown; error: StorageError }>;
  deleteBucket(bucketId: string): Promise<{ error: StorageError }>;
};

export type BucketSpec = {
  id: string;
  public: boolean;
  fileSizeLimit: number;
  allowedMimeTypes: readonly string[];
};

type CompatPlan = {
  canonicalChecksums: ReadonlySet<string>;
  removalFragments: readonly string[];
  executeSql: boolean;
  predecessors: readonly string[];
};

const KYC_BUCKET: BucketSpec = {
  id: 'foodflow-kyc',
  public: false,
  fileSizeLimit: 4_194_304,
  allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
};

const PRODUCTION_BUCKET: BucketSpec = {
  id: 'foodflow-production',
  public: true,
  fileSizeLimit: 5_242_880,
  allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif'],
};

const PUBLIC_BUCKET: BucketSpec = {
  id: 'foodflow-public',
  public: true,
  fileSizeLimit: 5_242_880,
  allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/avif'],
};

const PRIVATE_BUCKET: BucketSpec = {
  id: 'foodflow-private',
  public: false,
  fileSizeLimit: 4_194_304,
  allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'],
};

export const SECURE_DRIVER_KYC_MIGRATION = '20260710220000_secure_driver_kyc';
export const PRODUCTION_BUCKET_MIGRATION = '20260712143000_add_production_storage_bucket';
export const AUTHORIZE_BROADCAST_MIGRATION =
  '20260712161000_authorize_private_broadcast_and_split_storage';
export const REMOVE_LEGACY_BUCKETS_MIGRATION =
  '20260715010000_remove_empty_legacy_storage_buckets';

export const PROVIDER_MIGRATION_ORDER = [
  SECURE_DRIVER_KYC_MIGRATION,
  PRODUCTION_BUCKET_MIGRATION,
  AUTHORIZE_BROADCAST_MIGRATION,
  REMOVE_LEGACY_BUCKETS_MIGRATION,
] as const;

const BROADCAST_POLICY_NAME = 'foodflow scoped broadcast receive';
const STORAGE_READ_POLICY_NAME = 'public can read published foodflow media';

export const PROVIDER_COMPATIBLE_MIGRATIONS: ReadonlyMap<string, CompatPlan> = new Map([
  [
    SECURE_DRIVER_KYC_MIGRATION,
    {
      // sha256 of canonical migration.sql (raw CRLF bytes + LF variant)
      canonicalChecksums: new Set([
        'a448c52c08905709ced445aadc5ba016428fdf731acff993c8af26d91c5b8e2b',
        '2a490ac2d3798ba1dc86810ff25f7530bee7fb800e2d1b27fbfe9b1cfb26bf1d',
      ]),
      removalFragments: [
        `    EXECUTE $bucket$
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
`,
      ],
      executeSql: true,
      predecessors: [],
    },
  ],
  [
    PRODUCTION_BUCKET_MIGRATION,
    {
      canonicalChecksums: new Set([
        '05ceefd2051eda16b4c32c82b8bc1add172f5278e7cf03066aff3bb4f445b32b',
        '4664ac4299eea854a16316be6a9ed689a3320c1fca2557a4fd00f011368fd8e6',
      ]),
      removalFragments: [
        `    INSERT INTO storage.buckets (
      id,
      name,
      public,
      file_size_limit,
      allowed_mime_types
    )
    VALUES (
      'foodflow-production',
      'foodflow-production',
      true,
      5242880,
      ARRAY[
        'image/jpeg',
        'image/png',
        'image/webp',
        'image/gif',
        'image/avif'
      ]::text[]
    )
    ON CONFLICT (id) DO UPDATE SET
      public = EXCLUDED.public,
      file_size_limit = EXCLUDED.file_size_limit,
      allowed_mime_types = EXCLUDED.allowed_mime_types;
`,
      ],
      executeSql: true,
      predecessors: [],
    },
  ],
  [
    AUTHORIZE_BROADCAST_MIGRATION,
    {
      canonicalChecksums: new Set([
        '2377d9eef37ff903a9574f6e06fd7db912e2f32f227dc1bb8d8b0eec91de2f69',
        '04dd91d8b9f7e1546ed55af900639e595cc444a4eb2af917b8707fc6bb86f756',
      ]),
      removalFragments: [
        `    ALTER TABLE realtime.messages ENABLE ROW LEVEL SECURITY;\n`,
        `    INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
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
`,
      ],
      executeSql: true,
      predecessors: [],
    },
  ],
  [
    REMOVE_LEGACY_BUCKETS_MIGRATION,
    {
      canonicalChecksums: new Set([
        '16a7d29feb5d6e13827fd60785e978c75f7570aff5202a14206b9359ccd62a10',
        '06550fb83ff2de9701992e82d6c99768dc4746780349253950e4f3944850544c',
      ]),
      // The entire body is provider-bucket mutation; the accepted contract is
      // Storage-API deletion of only-empty legacy buckets (same as the
      // existing production-migrate wrapper). No SQL fragment executes.
      removalFragments: [],
      executeSql: false,
      predecessors: [
        SECURE_DRIVER_KYC_MIGRATION,
        PRODUCTION_BUCKET_MIGRATION,
        AUTHORIZE_BROADCAST_MIGRATION,
      ],
    },
  ],
]);

export type ReceiptStatus = 'pending' | 'completed';

export type ManagedBootstrapReceiptEntry = {
  type: 'managed-bootstrap';
  migrationName: string;
  status: ReceiptStatus;
  sourceRevision: string;
  canonicalChecksum: string;
  transportChecksum: string | null;
  actions: string[];
  resolvedAt: string;
};

export type PrefixSchemaDir = {
  schemaPath: string;
  dispose: () => Promise<void>;
};

export type ManagedBootstrapDeps = {
  prisma: PrismaClient;
  storage: ManagedStorageApi;
  runPrisma: (arguments_: string[]) => Promise<void>;
  readMigrationSql: (migrationName: string) => Promise<string>;
  listCanonicalMigrations: () => Promise<string[]>;
  preparePrefixSchemaDir: (migrationDirs: string[]) => Promise<PrefixSchemaDir>;
  sourceRevision?: string;
  log: (message: string) => void;
  now: () => Date;
};

function sha256(content: string): string {
  return createHash('sha256').update(content).digest('hex');
}

function moduleRevision(): string {
  try {
    return sha256(readFileSync(__filename, 'utf8'));
  } catch {
    return 'unknown';
  }
}

export function extractCompatibleSql(
  sql: string,
  removalFragments: readonly string[],
): { sql: string; missingFragments: string[] } {
  let result = sql;
  const missingFragments: string[] = [];
  for (const fragment of removalFragments) {
    if (!result.includes(fragment)) {
      missingFragments.push(fragment);
      continue;
    }
    result = result.replace(fragment, '');
  }
  return { sql: result, missingFragments };
}

/**
 * Prisma's raw driver accepts exactly one statement per call. A multi-command
 * batch is transported as the literal argument of a single `EXECUTE` inside a
 * `DO` block (verified against real PostgreSQL: nested dollar-quoted DO blocks
 * survive because the wrapper tags never collide with canonical `$bucket$`,
 * `$roles$`, `$policy$`, `$storage$` tags).
 */
export function wrapAsSingleStatement(sql: string): string {
  let inner = '$mb_exec$';
  let outer = '$mb_do$';
  while (sql.includes(inner) || sql.includes(outer)) {
    inner = `${inner.slice(0, -1)}x$`;
    outer = `${outer.slice(0, -1)}x$`;
  }
  return `DO ${outer}\nBEGIN\n  EXECUTE ${inner}\n${sql}\n  ${inner};\nEND\n${outer};`;
}

function sortedMimeTypes(value: readonly string[] | null | undefined): string {
  return [...(value ?? [])].sort().join(',');
}

function bucketMatchesSpec(
  bucket: StorageBucketRecord,
  spec: BucketSpec,
): boolean {
  return (
    bucket.public === spec.public &&
    Number(bucket.file_size_limit) === spec.fileSizeLimit &&
    sortedMimeTypes(bucket.allowed_mime_types) === sortedMimeTypes(spec.allowedMimeTypes)
  );
}

async function listBucketIds(storage: ManagedStorageApi): Promise<Set<string>> {
  const { data: buckets, error } = await storage.listBuckets();
  if (error || !buckets) {
    throw new Error(
      `Unable to list Supabase Storage buckets: ${error?.message ?? 'empty response'}`,
    );
  }
  return new Set(buckets.map((bucket) => bucket.id));
}

export async function ensureStorageBuckets(
  storage: ManagedStorageApi,
  specs: readonly BucketSpec[],
  actions: string[],
): Promise<void> {
  // Existence comes from a successful listBuckets inventory only. The real
  // storage-js getBucket returns a 404 StorageApiError for absent buckets —
  // never treat that shape as "not found" or create becomes unreachable.
  const inventory = await listBucketIds(storage);

  for (const spec of specs) {
    if (!inventory.has(spec.id)) {
      const { error: createError } = await storage.createBucket(spec.id, {
        id: spec.id,
        public: spec.public,
        fileSizeLimit: spec.fileSizeLimit,
        allowedMimeTypes: spec.allowedMimeTypes,
      });
      if (createError) {
        throw new Error(`Failed to create Storage bucket ${spec.id}: ${createError.message}`);
      }
      actions.push(`created Storage bucket ${spec.id} via API`);
    } else {
      const { data: detail, error } = await storage.getBucket(spec.id);
      if (error || !detail) {
        throw new Error(
          `Unable to verify Storage bucket ${spec.id}: ${error?.message ?? 'empty response'}`,
        );
      }
      if (!bucketMatchesSpec(detail, spec)) {
        const { error: updateError } = await storage.updateBucket(spec.id, {
          id: spec.id,
          public: spec.public,
          fileSizeLimit: spec.fileSizeLimit,
          allowedMimeTypes: spec.allowedMimeTypes,
        });
        if (updateError) {
          throw new Error(`Failed to update Storage bucket ${spec.id}: ${updateError.message}`);
        }
        actions.push(`updated Storage bucket ${spec.id} config via API`);
      } else {
        actions.push(`Storage bucket ${spec.id} already compliant`);
      }
    }
  }

  // Postcondition: re-read the provider inventory and config after mutation.
  const after = await listBucketIds(storage);
  for (const spec of specs) {
    if (!after.has(spec.id)) {
      throw new Error(`Postcondition failed: Storage bucket ${spec.id} missing after mutation`);
    }
    const { data: verified, error: verifyError } = await storage.getBucket(spec.id);
    if (verifyError || !verified) {
      throw new Error(
        `Postcondition failed: Storage bucket ${spec.id} cannot be verified after mutation`,
      );
    }
    if (!bucketMatchesSpec(verified, spec)) {
      throw new Error(`Postcondition failed: Storage bucket ${spec.id} config mismatch`);
    }
  }
}

async function assertRelationRls(
  prisma: PrismaClient,
  schema: string,
  table: string,
  required: boolean,
): Promise<void> {
  const rows = await prisma.$queryRawUnsafe<Array<{ relrowsecurity: boolean }>>(
    `SELECT c.relrowsecurity FROM pg_class c
     JOIN pg_namespace n ON n.oid = c.relnamespace
     WHERE n.nspname = '${schema}' AND c.relname = '${table}'`,
  );
  const row = rows[0];
  if (!row) {
    if (required) {
      throw new Error(`Postcondition failed: ${schema}.${table} is missing`);
    }
    return;
  }
  if (row.relrowsecurity !== true) {
    throw new Error(`Postcondition failed: ${schema}.${table} row level security is disabled`);
  }
}

type PgPolicy = {
  policyname: string;
  cmd: string;
  permissive: string;
  roles: string[] | string;
  qual: string | null;
};

function policyRoles(roles: PgPolicy['roles']): string[] {
  if (Array.isArray(roles)) return roles;
  return String(roles).replace(/[{}]/g, '').split(',').filter(Boolean);
}

// Catalog output of the canonical policies on PostgreSQL 16. Compare the
// complete expression; marker checks also accept an added OR true clause.
export const EXPECTED_BROADCAST_PREDICATE = `((extension = 'broadcast'::text) AND (( SELECT realtime.topic() AS topic) IN ( SELECT jsonb_array_elements_text(COALESCE((( SELECT auth.jwt() AS jwt) -> 'realtime_channels'::text), '[]'::jsonb)) AS jsonb_array_elements_text)))`;
export const EXPECTED_STORAGE_PREDICATE = `(bucket_id = 'foodflow-public'::text)`;
const normalizeCatalogExpression = (value: string | null) => (value ?? '').replace(/\s+/g, '');

async function policyInventory(
  prisma: PrismaClient,
  schema: string,
  table: string,
): Promise<PgPolicy[]> {
  return prisma.$queryRawUnsafe<PgPolicy[]>(
    `SELECT policyname::text, cmd::text, permissive::text, roles::text[], qual::text FROM pg_policies
     WHERE schemaname = '${schema}' AND tablename = '${table}'`,
  );
}

function assertSinglePolicy(
  policies: PgPolicy[],
  expectedName: string,
  label: string,
): PgPolicy {
  const expected = policies.filter((p) => p.policyname === expectedName);
  const unexpected = policies.filter((p) => p.policyname !== expectedName);
  if (expected.length === 0) {
    throw new Error(`Postcondition failed: policy "${expectedName}" missing on ${label}`);
  }
  if (expected.length > 1) {
    throw new Error(`Postcondition failed: duplicate "${expectedName}" policies on ${label}`);
  }
  if (unexpected.length > 0) {
    // Any other permissive policy OR-bypasses the scoped predicate.
    throw new Error(
      `Postcondition failed: unexpected policies on ${label} ` +
        `(${unexpected.map((p) => p.policyname).join(', ')}) broaden access beyond the scoped policy`,
    );
  }
  return expected[0];
}

async function assertBroadcastPolicyInventory(prisma: PrismaClient): Promise<void> {
  const policy = assertSinglePolicy(
    await policyInventory(prisma, 'realtime', 'messages'),
    BROADCAST_POLICY_NAME,
    'realtime.messages',
  );
  if (policy.cmd !== 'SELECT') {
    throw new Error(
      `Postcondition failed: "${BROADCAST_POLICY_NAME}" must be receive-only SELECT, got ${policy.cmd}`,
    );
  }
  if (policy.permissive !== 'PERMISSIVE') {
    throw new Error(
      `Postcondition failed: "${BROADCAST_POLICY_NAME}" must be PERMISSIVE scoped policy`,
    );
  }
  if (policyRoles(policy.roles).sort().join(',') !== 'authenticated') {
    throw new Error(
      `Postcondition failed: "${BROADCAST_POLICY_NAME}" must apply to authenticated`,
    );
  }
  if (normalizeCatalogExpression(policy.qual) !== normalizeCatalogExpression(EXPECTED_BROADCAST_PREDICATE)) {
    throw new Error(
      `Postcondition failed: "${BROADCAST_POLICY_NAME}" predicate drifted from the scoped broadcast rule`,
    );
  }
}

async function assertStorageReadPolicy(prisma: PrismaClient): Promise<void> {
  const objectsRows = await prisma.$queryRawUnsafe<Array<{ exists: boolean }>>(
    `SELECT to_regclass('storage.objects') IS NOT NULL AS "exists"`,
  );
  if (!objectsRows[0]?.exists) return;
  const policy = assertSinglePolicy(
    await policyInventory(prisma, 'storage', 'objects'),
    STORAGE_READ_POLICY_NAME,
    'storage.objects',
  );
  if (policy.cmd !== 'SELECT') {
    throw new Error(
      `Postcondition failed: "${STORAGE_READ_POLICY_NAME}" must be SELECT-only, got ${policy.cmd}`,
    );
  }
  const roles = policyRoles(policy.roles);
  if (roles.sort().join(',') !== 'anon,authenticated' || policy.permissive !== 'PERMISSIVE') {
    throw new Error(
      `Postcondition failed: "${STORAGE_READ_POLICY_NAME}" must apply to anon and authenticated`,
    );
  }
  if (normalizeCatalogExpression(policy.qual) !== normalizeCatalogExpression(EXPECTED_STORAGE_PREDICATE)) {
    throw new Error(
      `Postcondition failed: "${STORAGE_READ_POLICY_NAME}" predicate must be scoped to foodflow-public`,
    );
  }
}

async function assertOutboxClientGrantsRevoked(prisma: PrismaClient): Promise<void> {
  const rows = await prisma.$queryRawUnsafe<
    Array<{ grantee: string; privilege_type: string }>
  >(
    `SELECT r.rolname::text AS grantee, p.privilege_type::text AS privilege_type
     FROM pg_class c
     JOIN pg_namespace n ON n.oid = c.relnamespace
     CROSS JOIN pg_roles r
     CROSS JOIN LATERAL unnest(ARRAY['SELECT','INSERT','UPDATE','DELETE','TRUNCATE','REFERENCES','TRIGGER']) p(privilege_type)
     WHERE n.nspname = 'public' AND c.relname = 'realtime_outbox'
       AND r.rolname IN ('anon','authenticated')
       AND has_table_privilege(r.oid, c.oid, p.privilege_type)`,
  );
  if (rows.length > 0) {
    throw new Error(
      `Postcondition failed: public.realtime_outbox retains client grants ` +
        `(${rows.map((r) => `${r.grantee}:${r.privilege_type}`).join(', ')})`,
    );
  }
}

async function assertOutboxNotPublished(prisma: PrismaClient): Promise<void> {
  const rows = await prisma.$queryRawUnsafe<Array<{ tablename: string }>>(
    `SELECT tablename FROM pg_publication_tables
     WHERE pubname = 'supabase_realtime'
       AND schemaname = 'public'
       AND tablename = 'realtime_outbox'`,
  );
  if (rows.length > 0) {
    throw new Error(
      'Postcondition failed: public.realtime_outbox still in supabase_realtime publication',
    );
  }
}

export async function assertKycPostconditions(prisma: PrismaClient): Promise<void> {
  const index = await prisma.$queryRawUnsafe<
    Array<{ indisunique: boolean; indisvalid: boolean; indisready: boolean; table_schema: string; table_name: string; key_columns: string[]; no_expressions: boolean; predicate: string | null; attribute_count: number }>
  >(
    `SELECT i.indisunique, i.indisvalid, i.indisready,
       tn.nspname::text AS table_schema, t.relname::text AS table_name,
       ARRAY(SELECT pg_get_indexdef(i.indexrelid, k, true) FROM generate_series(1, i.indnkeyatts) k)::text[] AS key_columns,
       i.indexprs IS NULL AS no_expressions,
       pg_get_expr(i.indpred, i.indrelid)::text AS predicate,
       i.indnatts::int AS attribute_count
     FROM pg_index i
     JOIN pg_class c ON c.oid = i.indexrelid
     JOIN pg_namespace n ON n.oid = c.relnamespace
     JOIN pg_class t ON t.oid = i.indrelid
     JOIN pg_namespace tn ON tn.oid = t.relnamespace
     WHERE n.nspname = 'public' AND c.relname = 'driver_kyc_one_pending_per_profile_idx'`,
  );
  const row = index[0];
  if (!row) {
    throw new Error(
      'Postcondition failed: driver_kyc_one_pending_per_profile_idx index is missing',
    );
  }
  if (row.indisunique !== true) {
    throw new Error(
      'Postcondition failed: driver_kyc_one_pending_per_profile_idx is not unique',
    );
  }
  if (row.indisvalid !== true || row.indisready !== true
      || row.table_schema !== 'public' || row.table_name !== 'driver_kyc_submissions'
      || row.attribute_count !== 1 || row.no_expressions !== true
      || row.key_columns.length !== 1 || row.key_columns[0] !== 'driver_profile_id'
      || normalizeCatalogExpression(row.predicate) !== `(status='pending'::"KycStatus")`) {
    throw new Error(
      'Postcondition failed: driver_kyc_one_pending_per_profile_idx key/predicate drifted',
    );
  }
  await assertRelationRls(prisma, 'public', 'driver_kyc_submissions', true);
}

async function assertBroadcastPostconditions(
  prisma: PrismaClient,
  storage: ManagedStorageApi,
): Promise<void> {
  await assertRelationRls(prisma, 'realtime', 'messages', true);
  await assertBroadcastPolicyInventory(prisma);
  await assertRelationRls(prisma, 'public', 'realtime_outbox', false);
  await assertOutboxClientGrantsRevoked(prisma);
  await assertOutboxNotPublished(prisma);
  await assertStorageReadPolicy(prisma);
  const ids = await listBucketIds(storage);
  for (const required of [PUBLIC_BUCKET.id, PRIVATE_BUCKET.id]) {
    if (!ids.has(required)) {
      throw new Error(`Postcondition failed: Storage bucket ${required} is missing`);
    }
  }
}

async function assertPredecessorsFinished(
  prisma: PrismaClient,
  predecessors: readonly string[],
): Promise<void> {
  const finished = await finishedMigrationNames(prisma);
  const missing = predecessors.filter((name) => !finished.has(name));
  if (missing.length > 0) {
    throw new Error(
      `Refusing cleanup before predecessor creators finished: ${missing.join(', ')}`,
    );
  }
}

async function assertLegacyBucketsAbsent(storage: ManagedStorageApi): Promise<void> {
  const ids = await listBucketIds(storage);
  const remaining = LEGACY_BUCKETS.filter((id) => ids.has(id));
  if (remaining.length > 0) {
    throw new Error(
      `Postcondition failed: legacy Storage buckets still present: ${remaining.join(', ')}`,
    );
  }
}

async function executeCompatibleSql(
  prisma: PrismaClient,
  sql: string,
): Promise<string> {
  const transport = wrapAsSingleStatement(sql);
  await prisma.$transaction(async (tx) => {
    await tx.$executeRawUnsafe(transport);
  });
  return sha256(transport);
}

async function hasPrismaMigrationTable(prisma: PrismaClient): Promise<boolean> {
  const [result] = await prisma.$queryRawUnsafe<Array<{ exists: boolean }>>(
    `SELECT to_regclass('"_prisma_migrations"') IS NOT NULL AS "exists"`,
  );
  return result?.exists === true;
}

export type UnfinishedMigrationRow = {
  migration_name: string;
  checksum: string;
};

export async function listUnfinishedMigrations(
  prisma: PrismaClient,
): Promise<UnfinishedMigrationRow[]> {
  if (!(await hasPrismaMigrationTable(prisma))) return [];
  return prisma.$queryRawUnsafe<UnfinishedMigrationRow[]>(
    `SELECT migration_name, checksum FROM "_prisma_migrations"
     WHERE finished_at IS NULL AND rolled_back_at IS NULL
     ORDER BY started_at ASC`,
  );
}

async function finishedMigrationNames(prisma: PrismaClient): Promise<Set<string>> {
  if (!(await hasPrismaMigrationTable(prisma))) return new Set();
  const rows = await prisma.$queryRawUnsafe<Array<{ migration_name: string }>>(
    `SELECT migration_name FROM "_prisma_migrations"
     WHERE finished_at IS NOT NULL AND rolled_back_at IS NULL`,
  );
  return new Set(rows.map((row) => row.migration_name));
}

/**
 * Canonical dirs eligible for a prefix deploy before `before` (null = final
 * tail): non-provider migration directories only, in canonical order. The
 * provider dirs are never copied, so `migrate deploy` can never attempt the
 * provider-owned statements — even where a provider would allow them.
 */
export function selectPrefixDirs(
  allMigrationDirs: readonly string[],
  before: string | null,
): string[] {
  const providerDirs = new Set<string>(PROVIDER_MIGRATION_ORDER);
  return allMigrationDirs
    .filter((dir) => !providerDirs.has(dir))
    .filter((dir) => before === null || dir < before)
    .sort();
}

async function assertCanonicalPrefixApplied(
  prisma: PrismaClient,
  allMigrationDirs: readonly string[],
  before: string,
): Promise<void> {
  const finished = await finishedMigrationNames(prisma);
  const missing = allMigrationDirs
    .filter((dir) => dir < before)
    .filter((dir) => !finished.has(dir));
  if (missing.length > 0) {
    throw new Error(
      `Canonical prefix incomplete before ${before}: ${missing.join(', ')}`,
    );
  }
}

async function applyCompatibleMigration(
  migrationName: string,
  plan: CompatPlan,
  deps: ManagedBootstrapDeps,
): Promise<ManagedBootstrapReceiptEntry> {
  const rawSql = await deps.readMigrationSql(migrationName);
  const canonicalChecksum = sha256(rawSql);
  if (!plan.canonicalChecksums.has(canonicalChecksum)) {
    throw new Error(
      `Canonical checksum mismatch for ${migrationName}: ${canonicalChecksum}. Refusing to recover unverified migration bytes.`,
    );
  }

  const lfSql = rawSql.replace(/\r\n/g, '\n');
  const { sql: compatSql, missingFragments } = extractCompatibleSql(
    lfSql,
    plan.removalFragments,
  );
  if (missingFragments.length > 0) {
    throw new Error(
      `Canonical migration ${migrationName} drifted from expected statements; refusing compatibility execution`,
    );
  }

  const actions: string[] = [];
  let transportChecksum: string | null = null;

  if (plan.predecessors.length > 0) {
    await assertPredecessorsFinished(deps.prisma, plan.predecessors);
    actions.push('verified predecessor bucket creators applied');
  }

  if (migrationName === AUTHORIZE_BROADCAST_MIGRATION) {
    // The provider table already has RLS enabled; the canonical ALTER is the
    // forbidden owner operation. Fail closed when it is absent or disabled.
    await assertRelationRls(deps.prisma, 'realtime', 'messages', true);
    actions.push('verified realtime.messages RLS already enabled by provider');
  }

  if (plan.executeSql) {
    transportChecksum = await executeCompatibleSql(deps.prisma, compatSql);
    actions.push('executed canonical statements minus provider-forbidden fragments');
  }

  if (migrationName === SECURE_DRIVER_KYC_MIGRATION) {
    await ensureStorageBuckets(deps.storage, [KYC_BUCKET], actions);
    await assertKycPostconditions(deps.prisma);
    actions.push('verified driver_kyc_submissions index uniqueness/predicate and RLS');
  }

  if (migrationName === PRODUCTION_BUCKET_MIGRATION) {
    await ensureStorageBuckets(deps.storage, [PRODUCTION_BUCKET], actions);
  }

  if (migrationName === AUTHORIZE_BROADCAST_MIGRATION) {
    await ensureStorageBuckets(deps.storage, [PUBLIC_BUCKET, PRIVATE_BUCKET], actions);
    await assertBroadcastPostconditions(deps.prisma, deps.storage);
    actions.push('verified broadcast policy inventory, outbox revokes, publication removal and storage policy');
  }

  if (migrationName === REMOVE_LEGACY_BUCKETS_MIGRATION) {
    const deleted = await deleteEmptyLegacyBuckets(deps.storage);
    actions.push(
      deleted.length === 0
        ? 'legacy Storage buckets already absent'
        : `deleted empty legacy Storage buckets via API: ${deleted.join(', ')}`,
    );
    await assertLegacyBucketsAbsent(deps.storage);
    actions.push('verified legacy Storage buckets absent');
  }

  return {
    type: 'managed-bootstrap',
    migrationName,
    status: 'pending',
    sourceRevision: deps.sourceRevision ?? moduleRevision(),
    canonicalChecksum,
    transportChecksum,
    actions,
    resolvedAt: deps.now().toISOString(),
  };
}

async function resolveApplied(
  deps: ManagedBootstrapDeps,
  migrationName: string,
): Promise<void> {
  // resolve reads the real migration dir to record the canonical checksum —
  // always point at the real schema, never a prefix tempdir.
  await deps.runPrisma([
    'migrate',
    'resolve',
    '--applied',
    migrationName,
    '--schema',
    'prisma/schema.prisma',
  ]);
}

async function runCheckpoint(
  migrationName: string,
  deps: ManagedBootstrapDeps,
  receipt: ManagedBootstrapReceiptEntry[],
): Promise<void> {
  const plan = PROVIDER_COMPATIBLE_MIGRATIONS.get(migrationName);
  if (!plan) {
    throw new Error(`Refusing provider migration without an approved plan: ${migrationName}`);
  }
  const entry = await applyCompatibleMigration(migrationName, plan, deps);
  receipt.push(entry);
  deps.log(JSON.stringify(entry));

  await resolveApplied(deps, migrationName);
  entry.status = 'completed';
  entry.resolvedAt = deps.now().toISOString();
  deps.log(JSON.stringify(entry));
}

async function deployPrefix(
  deps: ManagedBootstrapDeps,
  allDirs: readonly string[],
  before: string | null,
): Promise<void> {
  const dirs = selectPrefixDirs(allDirs, before);
  const prefix = await deps.preparePrefixSchemaDir(dirs);
  try {
    await deps.runPrisma(['migrate', 'deploy', '--schema', prefix.schemaPath]);
  } finally {
    await prefix.dispose();
  }
}

export async function runManagedBootstrap(
  deps: ManagedBootstrapDeps,
): Promise<ManagedBootstrapReceiptEntry[]> {
  // Verify successful migration provenance before any provider mutation.
  // Pristine installs have no history table yet — the guard allows absence
  // here while still rejecting any applied checksum drift.
  await assertAppliedMigrationChecksums(deps.prisma, {
    requireMigrationTable: false,
  });

  const allDirs = await deps.listCanonicalMigrations();
  const receipt: ManagedBootstrapReceiptEntry[] = [];

  // Phase 0 — a current failed/interrupted row is handled first: exactly one
  // unfinished row, allowlisted, whose recorded checksum is a pinned canonical
  // variant. Anything else fails closed before any mutation or resolve.
  for (let attempts = 0; attempts <= PROVIDER_MIGRATION_ORDER.length; attempts += 1) {
    const unfinished = await listUnfinishedMigrations(deps.prisma);
    if (unfinished.length === 0) break;
    if (unfinished.length > 1) {
      throw new Error(
        `Refusing ambiguous unfinished migration state: ${unfinished
          .map((row) => row.migration_name)
          .join(', ')}`,
      );
    }
    const row = unfinished[0];
    const plan = PROVIDER_COMPATIBLE_MIGRATIONS.get(row.migration_name);
    if (!plan) {
      throw new Error(
        `Refusing to recover unknown failed migration state: ${row.migration_name}`,
      );
    }
    if (!plan.canonicalChecksums.has(row.checksum)) {
      throw new Error(
        `Failed migration row ${row.migration_name} has unverified bytes ` +
          `(recorded checksum ${row.checksum}); refusing to resolve`,
      );
    }
    await runCheckpoint(row.migration_name, deps, receipt);
  }

  // Phase 1 — proactive ordered checkpoints. Each provider migration first
  // gets a canonical-prefix deploy (non-provider dirs < checkpoint only), then
  // its compatibility checkpoint and verified resolve.
  for (const name of PROVIDER_MIGRATION_ORDER) {
    const finished = await finishedMigrationNames(deps.prisma);
    if (finished.has(name)) continue;
    await deployPrefix(deps, allDirs, name);
    await assertCanonicalPrefixApplied(deps.prisma, allDirs, name);
    await runCheckpoint(name, deps, receipt);
  }

  // Phase 2 — canonical tail: every remaining non-provider migration.
  await deployPrefix(deps, allDirs, null);

  const finished = await finishedMigrationNames(deps.prisma);
  const incomplete = allDirs.filter((dir) => !finished.has(dir));
  if (incomplete.length > 0) {
    throw new Error(
      `Managed bootstrap incomplete; canonical migrations not applied: ${incomplete.join(', ')}`,
    );
  }

  deps.log(JSON.stringify({ type: 'managed-bootstrap', status: 'done', receipt }));
  return receipt;
}

async function defaultRunPrisma(arguments_: string[]): Promise<void> {
  const prismaCli = join(process.cwd(), 'node_modules', 'prisma', 'build', 'index.js');

  await new Promise<void>((resolve, reject) => {
    const child = spawn(process.execPath, [prismaCli, ...arguments_], {
      stdio: 'inherit',
    });
    child.once('error', reject);
    child.once('exit', (code, signal) => {
      if (code === 0) {
        resolve();
        return;
      }
      reject(
        new Error(
          `Prisma ${arguments_.join(' ')} failed with ${signal ?? `exit code ${code}`}`,
        ),
      );
    });
  });
}

async function defaultReadMigrationSql(migrationName: string): Promise<string> {
  return readFileAsync(
    join(process.cwd(), 'prisma', 'migrations', migrationName, 'migration.sql'),
    'utf8',
  );
}

async function defaultListCanonicalMigrations(): Promise<string[]> {
  const entries = await readdirAsync(join(process.cwd(), 'prisma', 'migrations'), {
    withFileTypes: true,
  });
  return entries.filter((entry) => entry.isDirectory()).map((entry) => entry.name).sort();
}

async function defaultPreparePrefixSchemaDir(
  migrationDirs: string[],
): Promise<PrefixSchemaDir> {
  const root = await mkdtempAsync(join(tmpdir(), 'foodflow-mb-'));
  const migrationsDir = join(root, 'migrations');
  await mkdirAsync(migrationsDir, { recursive: true });
  // Byte-identical copies — deploy records the same canonical checksums.
  await copyFileAsync(
    join(process.cwd(), 'prisma', 'schema.prisma'),
    join(root, 'schema.prisma'),
  );
  for (const dir of migrationDirs) {
    const target = join(migrationsDir, dir);
    await mkdirAsync(target, { recursive: true });
    await copyFileAsync(
      join(process.cwd(), 'prisma', 'migrations', dir, 'migration.sql'),
      join(target, 'migration.sql'),
    );
  }
  return {
    schemaPath: join(root, 'schema.prisma'),
    dispose: async () => {
      await rmAsync(root, { recursive: true, force: true });
    },
  };
}

export async function main(): Promise<void> {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !supabaseServiceRoleKey) {
    throw new Error(
      'SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required for managed bootstrap',
    );
  }

  const prisma = new PrismaClient();
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    await runManagedBootstrap({
      prisma,
      storage: supabase.storage as unknown as ManagedStorageApi,
      runPrisma: defaultRunPrisma,
      readMigrationSql: defaultReadMigrationSql,
      listCanonicalMigrations: defaultListCanonicalMigrations,
      preparePrefixSchemaDir: defaultPreparePrefixSchemaDir,
      log: (message) => console.log(message),
      now: () => new Date(),
    });
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  void main().catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  });
}
