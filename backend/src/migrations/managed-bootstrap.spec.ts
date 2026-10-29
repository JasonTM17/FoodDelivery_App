import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { join } from 'node:path';
import type { PrismaClient } from '@prisma/client';
import {
  AUTHORIZE_BROADCAST_MIGRATION,
  PROVIDER_COMPATIBLE_MIGRATIONS,
  PROVIDER_MIGRATION_ORDER,
  REMOVE_LEGACY_BUCKETS_MIGRATION,
  SECURE_DRIVER_KYC_MIGRATION,
  extractCompatibleSql,
  EXPECTED_BROADCAST_PREDICATE,
  runManagedBootstrap,
  selectPrefixDirs,
  wrapAsSingleStatement,
  type ManagedStorageApi,
} from './managed-bootstrap';

jest.mock('./migration-checksum-guard', () => ({
  assertAppliedMigrationChecksums: jest.fn().mockResolvedValue(undefined),
}));

const realMigrationSql = (name: string) =>
  readFile(join(process.cwd(), 'prisma', 'migrations', name, 'migration.sql'), 'utf8');

const ALL_DIRS = [
  '20260701000000_early_init',
  '20260705000000_early_orders',
  SECURE_DRIVER_KYC_MIGRATION,
  '20260711000000_mid_domain',
  '20260712143000_add_production_storage_bucket',
  '20260712150000_harden_supabase_advisors',
  AUTHORIZE_BROADCAST_MIGRATION,
  '20260714040000_remove_public_storage_listing_policy',
  REMOVE_LEGACY_BUCKETS_MIGRATION,
  '20260715101500_verify_legacy_storage_bucket_cleanup',
];

const BROADCAST_CHECKSUM =
  '2377d9eef37ff903a9574f6e06fd7db912e2f32f227dc1bb8d8b0eec91de2f69';

type QueryRoute = { match: string; rows: unknown[] };

function makePrisma(
  routes: QueryRoute[],
  calls: string[],
  state: { unfinished: Array<{ migration_name: string; checksum: string }>; finished: Set<string> },
) {
  const allRoutes: QueryRoute[] = [
    ...routes,
    { match: `to_regclass('"_prisma_migrations"')`, rows: [{ exists: true }] },
    {
      match: `finished_at IS NULL AND rolled_back_at IS NULL`,
      get rows() {
        return state.unfinished;
      },
    },
    {
      match: `finished_at IS NOT NULL AND rolled_back_at IS NULL`,
      get rows() {
        return [...state.finished].map((migration_name) => ({ migration_name }));
      },
    },
  ];
  const tx = {
    $executeRawUnsafe: jest.fn(async (sql: string) => {
      calls.push('exec:transport');
      expect(sql.startsWith('DO $mb_do$')).toBe(true);
      expect(sql).toContain('EXECUTE $mb_exec$');
      return 0;
    }),
  };
  const prisma = {
    $queryRawUnsafe: jest.fn(async (sql: string) => {
      const route = allRoutes.find((r) => sql.includes(r.match));
      if (!route) throw new Error(`unhandled query: ${sql}`);
      return route.rows;
    }),
    $executeRawUnsafe: tx.$executeRawUnsafe,
    $transaction: jest.fn(async (callback: (tx: unknown) => Promise<unknown>) =>
      callback(tx),
    ),
    $disconnect: jest.fn(async () => undefined),
  };
  return prisma as unknown as PrismaClient;
}

const storage404 = () => ({
  name: 'StorageApiError',
  message: 'Bucket not found',
  status: 404,
  statusCode: '404',
});

function makeStorage(
  buckets: Map<string, Record<string, unknown>>,
  calls: string[],
  overrides: Partial<
    Record<'createBucket' | 'updateBucket' | 'deleteBucket' | 'listBuckets' | 'getBucket', { message: string }>
  > = {},
): ManagedStorageApi {
  const record = (id: string) => {
    const bucket = buckets.get(id);
    return bucket ? { id, ...bucket } : null;
  };
  return {
    listBuckets: jest.fn(async () => {
      calls.push('api:listBuckets');
      if (overrides.listBuckets) return { data: null, error: overrides.listBuckets };
      return { data: [...buckets.keys()].map((id) => ({ id })), error: null };
    }),
    getBucket: jest.fn(async (id: string) => {
      calls.push(`api:getBucket:${id}`);
      if (overrides.getBucket) return { data: null, error: overrides.getBucket };
      // real storage-js shape: absent bucket is a 404 StorageApiError, not null/no-error
      if (!buckets.has(id)) return { data: null, error: storage404() };
      return { data: record(id), error: null };
    }),
    createBucket: jest.fn(async (id: string, options: Record<string, unknown>) => {
      calls.push(`api:createBucket:${id}`);
      if (overrides.createBucket) return { data: null, error: overrides.createBucket };
      buckets.set(id, {
        public: options.public,
        file_size_limit: options.fileSizeLimit,
        allowed_mime_types: options.allowedMimeTypes,
      });
      return { data: {}, error: null };
    }),
    updateBucket: jest.fn(async (id: string, options: Record<string, unknown>) => {
      calls.push(`api:updateBucket:${id}`);
      if (overrides.updateBucket) return { data: null, error: overrides.updateBucket };
      buckets.set(id, {
        public: options.public,
        file_size_limit: options.fileSizeLimit,
        allowed_mime_types: options.allowedMimeTypes,
      });
      return { data: {}, error: null };
    }),
    deleteBucket: jest.fn(async (id: string) => {
      calls.push(`api:deleteBucket:${id}`);
      if (overrides.deleteBucket) return { error: overrides.deleteBucket };
      buckets.delete(id);
      return { error: null };
    }),
  };
}

const broadcastPolicy = (overrides: Record<string, unknown> = {}) => ({
  policyname: 'foodflow scoped broadcast receive',
  cmd: 'SELECT',
  permissive: 'PERMISSIVE',
  roles: ['authenticated'],
  qual: EXPECTED_BROADCAST_PREDICATE,
  ...overrides,
});

const storageReadPolicy = (overrides: Record<string, unknown> = {}) => ({
  policyname: 'public can read published foodflow media',
  cmd: 'SELECT',
  permissive: 'PERMISSIVE',
  roles: ['anon', 'authenticated'],
  qual: `(bucket_id = 'foodflow-public'::text)`,
  ...overrides,
});

const healthyRoutes: QueryRoute[] = [
  { match: `privilege_type`, rows: [] },
  { match: `c.relname = 'realtime_outbox'`, rows: [{ relrowsecurity: true }] },
  { match: `c.relname = 'messages'`, rows: [{ relrowsecurity: true }] },
  { match: `tablename = 'messages'`, rows: [broadcastPolicy()] },
  { match: `pubname = 'supabase_realtime'`, rows: [] },
  { match: `to_regclass('storage.objects')`, rows: [{ exists: true }] },
  { match: `tablename = 'objects'`, rows: [storageReadPolicy()] },
  {
    match: `indisunique`,
    rows: [
      {
        indisunique: true,
        indisvalid: true,
        indisready: true,
        table_schema: 'public',
        table_name: 'driver_kyc_submissions',
        attribute_count: 1,
        no_expressions: true,
        key_columns: ['driver_profile_id'],
        predicate: `(status = 'pending'::"KycStatus")`,
        indexdef: `CREATE UNIQUE INDEX driver_kyc_one_pending_per_profile_idx ON public.driver_kyc_submissions USING btree (driver_profile_id) WHERE ((status)::text = 'pending'::text)`,
      },
    ],
  },
  { match: `c.relname = 'driver_kyc_submissions'`, rows: [{ relrowsecurity: true }] },
];

const compliantBucket = (id: string) => {
  const specs: Record<string, Record<string, unknown>> = {
    'foodflow-kyc': { public: false, file_size_limit: 4194304, allowed_mime_types: ['image/jpeg', 'image/png', 'image/webp'] },
    'foodflow-production': { public: true, file_size_limit: 5242880, allowed_mime_types: ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif'] },
    'foodflow-public': { public: true, file_size_limit: 5242880, allowed_mime_types: ['image/jpeg', 'image/png', 'image/webp', 'image/avif'] },
    'foodflow-private': { public: false, file_size_limit: 4194304, allowed_mime_types: ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'] },
  };
  return specs[id];
};

function makeDeps(overrides: {
  calls: string[];
  routes?: QueryRoute[];
  buckets?: Map<string, Record<string, unknown>>;
  unfinished?: Array<{ migration_name: string; checksum: string }>;
  finished?: Set<string>;
  storageOverrides?: Parameters<typeof makeStorage>[2];
  readMigrationSql?: (name: string) => Promise<string>;
  failDeployForDirs?: (dirs: string[]) => boolean;
}) {
  const state = {
    unfinished: overrides.unfinished ?? [],
    finished: overrides.finished ?? new Set<string>(),
  };
  const prefixCalls: string[][] = [];
  const deploys: string[][] = [];
  const storage = makeStorage(overrides.buckets ?? new Map(), overrides.calls, overrides.storageOverrides);
  const deps = {
    prisma: makePrisma(overrides.routes ?? healthyRoutes, overrides.calls, state),
    storage,
    runPrisma: jest.fn(async (args: string[]) => {
      if (args.includes('resolve')) {
        const name = args[args.indexOf('--applied') + 1];
        overrides.calls.push(`resolve:${name}`);
        state.unfinished = state.unfinished.filter((row) => row.migration_name !== name);
        state.finished.add(name);
        return;
      }
      const dirs = prefixCalls[prefixCalls.length - 1] ?? [];
      if (overrides.failDeployForDirs?.(dirs)) {
        throw new Error('P3009 deploy failed');
      }
      overrides.calls.push('deploy:prefix');
      deploys.push(dirs);
      // Prefix deploy applies everything staged in the tempdir.
      dirs.forEach((dir) => state.finished.add(dir));
    }),
    readMigrationSql: overrides.readMigrationSql ?? realMigrationSql,
    listCanonicalMigrations: jest.fn(async () => ALL_DIRS),
    preparePrefixSchemaDir: jest.fn(async (dirs: string[]) => {
      prefixCalls.push(dirs);
      return {
        schemaPath: `C:/temp/ff-prefix-${prefixCalls.length}/schema.prisma`,
        dispose: jest.fn(async () => undefined),
      };
    }),
    sourceRevision: 'test-revision',
    log: jest.fn(),
    now: () => new Date('2026-07-15T00:00:00Z'),
  };
  return { deps, state, prefixCalls, deploys, storage };
}

describe('selectPrefixDirs', () => {
  it('excludes provider dirs and bounds by checkpoint', () => {
    const dirs = selectPrefixDirs(ALL_DIRS, AUTHORIZE_BROADCAST_MIGRATION);
    expect(dirs).toContain('20260712150000_harden_supabase_advisors');
    expect(dirs).not.toContain(AUTHORIZE_BROADCAST_MIGRATION);
    expect(dirs).not.toContain(SECURE_DRIVER_KYC_MIGRATION);
    expect(dirs).not.toContain('20260714040000_remove_public_storage_listing_policy');
    expect(dirs).not.toContain(REMOVE_LEGACY_BUCKETS_MIGRATION);
    expect(dirs).toEqual([...dirs].sort());
  });

  it('returns every non-provider dir for the final tail', () => {
    const dirs = selectPrefixDirs(ALL_DIRS, null);
    expect(dirs).toHaveLength(ALL_DIRS.length - PROVIDER_MIGRATION_ORDER.length);
    expect(dirs).toContain('20260715101500_verify_legacy_storage_bucket_cleanup');
  });
});

describe('wrapAsSingleStatement', () => {
  it('emits one DO..EXECUTE statement with collision-free tags', () => {
    const wrapped = wrapAsSingleStatement('SELECT 1;\nSELECT 2;');
    expect(wrapped).toBe('DO $mb_do$\nBEGIN\n  EXECUTE $mb_exec$\nSELECT 1;\nSELECT 2;\n  $mb_exec$;\nEND\n$mb_do$;');
  });

  it('extends tags when the payload collides', () => {
    const wrapped = wrapAsSingleStatement('SELECT $mb_exec$;');
    expect(wrapped).not.toContain('EXECUTE $mb_exec$\n');
    expect(wrapped).toContain('EXECUTE $mb_execx$');
  });
});

describe('extractCompatibleSql', () => {
  it('removes exactly the provider-forbidden fragments from canonical files', async () => {
    for (const [name, plan] of PROVIDER_COMPATIBLE_MIGRATIONS) {
      const raw = (await realMigrationSql(name)).replace(/\r\n/g, '\n');
      const { sql, missingFragments } = extractCompatibleSql(raw, plan.removalFragments);
      expect(missingFragments).toEqual([]);
      expect(sql).not.toContain('INSERT INTO storage.buckets');
      expect(sql).not.toContain('ALTER TABLE realtime.messages');
    }
    const broadcast = (await realMigrationSql(AUTHORIZE_BROADCAST_MIGRATION)).replace(/\r\n/g, '\n');
    const { sql } = extractCompatibleSql(
      broadcast,
      PROVIDER_COMPATIBLE_MIGRATIONS.get(AUTHORIZE_BROADCAST_MIGRATION)!.removalFragments,
    );
    expect(sql).toContain('CREATE POLICY "foodflow scoped broadcast receive"');
    expect(sql).toContain(`realtime.messages.extension = 'broadcast'`);
    expect(sql).toContain('REVOKE ALL ON TABLE public.realtime_outbox FROM anon');
    expect(sql).toContain('ALTER PUBLICATION supabase_realtime DROP TABLE public.realtime_outbox');
    expect(sql).toContain('CREATE POLICY "public can read published foodflow media"');
  });

  it('reports missing fragments instead of silently drifting', () => {
    const { missingFragments } = extractCompatibleSql('SELECT 1;\n', ['SELECT 2;\n']);
    expect(missingFragments).toEqual(['SELECT 2;\n']);
  });
});

describe('runManagedBootstrap', () => {
  it('pristine install: ordered checkpoints, deploy never sees provider dirs', async () => {
    const calls: string[] = [];
    const { deps, state, prefixCalls, deploys } = makeDeps({ calls });

    const receipt = await runManagedBootstrap(deps);
    expect(receipt.map((e) => e.migrationName)).toEqual([...PROVIDER_MIGRATION_ORDER]);
    expect(receipt.every((e) => e.status === 'completed')).toBe(true);

    // 4 prefix deploys + 1 tail deploy; deploy is never pointed at the real schema.
    expect(deploys).toHaveLength(5);
    for (const call of (deps.runPrisma as jest.Mock).mock.calls) {
      const args = call[0] as string[];
      if (args.includes('deploy')) {
        expect(args[args.indexOf('--schema') + 1]).toContain('ff-prefix');
      }
    }
    // Provider dirs never reach a prefix tempdir.
    expect(prefixCalls.flat()).not.toEqual(expect.arrayContaining([...PROVIDER_MIGRATION_ORDER]));
    // Canonical prefix enforced before each provider checkpoint.
    expect(prefixCalls[3]).toContain('20260714040000_remove_public_storage_listing_policy');
    expect(prefixCalls[3]).not.toContain('20260715101500_verify_legacy_storage_bucket_cleanup');
    // Resolves use the real schema (canonical checksum source) after postconditions.
    expect(calls.filter((c) => c.startsWith('resolve:'))).toEqual(
      [...PROVIDER_MIGRATION_ORDER].map((n) => `resolve:${n}`),
    );
    expect(calls.indexOf(`resolve:${SECURE_DRIVER_KYC_MIGRATION}`)).toBeGreaterThan(
      calls.indexOf('exec:transport'),
    );
    // Pending receipt emitted before resolve, completed after.
    const logs = (deps.log as jest.Mock).mock.calls.map((c) => JSON.parse(c[0]));
    const pending = logs.filter((l) => l.status === 'pending');
    const completed = logs.filter((l) => l.status === 'completed');
    expect(pending).toHaveLength(4);
    expect(completed).toHaveLength(4);
    expect(pending[0].canonicalChecksum).toBe(
      createHash('sha256').update(await realMigrationSql(pending[0].migrationName)).digest('hex'),
    );
    expect(state.unfinished).toHaveLength(0);
  });

  it('already-complete install: tail deploy only, empty receipt', async () => {
    const calls: string[] = [];
    const { deps, deploys } = makeDeps({ calls, finished: new Set(ALL_DIRS) });
    await expect(runManagedBootstrap(deps)).resolves.toEqual([]);
    expect(deploys).toHaveLength(1);
    expect(calls).not.toContain('exec:transport');
    expect(calls.filter((c) => c.startsWith('resolve:'))).toHaveLength(0);
  });

  it('recovers the current failed broadcast row after checksum verification', async () => {
    const calls: string[] = [];
    const finished = new Set(
      ALL_DIRS.filter(
        (dir) =>
          dir < AUTHORIZE_BROADCAST_MIGRATION && dir !== '20260712143000_add_production_storage_bucket',
      ),
    );
    finished.add('20260712143000_add_production_storage_bucket');
    const { deps, state } = makeDeps({
      calls,
      finished,
      unfinished: [{ migration_name: AUTHORIZE_BROADCAST_MIGRATION, checksum: BROADCAST_CHECKSUM }],
    });

    const receipt = await runManagedBootstrap(deps);
    expect(receipt[0].migrationName).toBe(AUTHORIZE_BROADCAST_MIGRATION);
    expect(calls).toContain(`resolve:${AUTHORIZE_BROADCAST_MIGRATION}`);
    // the failed row is resolved before any later checkpoint
    expect(receipt.map((e) => e.migrationName)).toEqual([
      AUTHORIZE_BROADCAST_MIGRATION,
      REMOVE_LEGACY_BUCKETS_MIGRATION,
    ]);
    expect(state.unfinished).toHaveLength(0);
  });

  it('interrupted rerun converges when provider state already exists', async () => {
    const calls: string[] = [];
    const buckets = new Map([
      ['foodflow-kyc', compliantBucket('foodflow-kyc')!],
      ['foodflow-production', compliantBucket('foodflow-production')!],
      ['foodflow-public', compliantBucket('foodflow-public')!],
      ['foodflow-private', compliantBucket('foodflow-private')!],
    ]);
    const { deps } = makeDeps({ calls, buckets });
    const receipt = await runManagedBootstrap(deps);
    expect(receipt).toHaveLength(4);
    expect(calls).not.toContain('api:createBucket:foodflow-public');
    expect(receipt[2].actions.join(' ')).toContain('already compliant');
  });

  it('rejects ambiguous unfinished history before any mutation', async () => {
    const calls: string[] = [];
    const { deps } = makeDeps({
      calls,
      unfinished: [
        { migration_name: AUTHORIZE_BROADCAST_MIGRATION, checksum: BROADCAST_CHECKSUM },
        { migration_name: REMOVE_LEGACY_BUCKETS_MIGRATION, checksum: 'x' },
      ],
    });
    await expect(runManagedBootstrap(deps)).rejects.toThrow('ambiguous unfinished migration state');
    expect(calls).not.toContain('exec:transport');
    expect(calls).not.toContain('api:listBuckets');
  });

  it('rejects an unknown failed migration name', async () => {
    const calls: string[] = [];
    const { deps } = makeDeps({
      calls,
      unfinished: [{ migration_name: '20990101000000_unknown', checksum: 'abc' }],
    });
    await expect(runManagedBootstrap(deps)).rejects.toThrow(
      'Refusing to recover unknown failed migration state: 20990101000000_unknown',
    );
    expect(calls).not.toContain('exec:transport');
  });

  it('rejects a failed row whose recorded checksum is not canonical', async () => {
    const calls: string[] = [];
    const { deps } = makeDeps({
      calls,
      unfinished: [
        { migration_name: AUTHORIZE_BROADCAST_MIGRATION, checksum: 'deadbeef'.repeat(8) },
      ],
    });
    await expect(runManagedBootstrap(deps)).rejects.toThrow('unverified bytes');
    expect(calls).not.toContain('exec:transport');
    expect(calls).not.toContainEqual(expect.stringContaining('resolve:'));
  });

  it('rejects canonical file drift before execution', async () => {
    const calls: string[] = [];
    const { deps } = makeDeps({
      calls,
      readMigrationSql: async (name) => `${await realMigrationSql(name)}\n-- tampered`,
    });
    await expect(runManagedBootstrap(deps)).rejects.toThrow('Canonical checksum mismatch');
    expect(calls).not.toContain('exec:transport');
  });

  it.each([
    ['absent', []],
    ['disabled', [{ relrowsecurity: false }]],
  ])('refuses when realtime.messages RLS is %s', async (_label, rows) => {
    const calls: string[] = [];
    const finished = new Set(ALL_DIRS.filter((dir) => dir < AUTHORIZE_BROADCAST_MIGRATION));
    const { deps } = makeDeps({
      calls,
      finished,
      unfinished: [{ migration_name: AUTHORIZE_BROADCAST_MIGRATION, checksum: BROADCAST_CHECKSUM }],
      routes: healthyRoutes.map((r) =>
        r.match === `c.relname = 'messages'` ? { ...r, rows } : r,
      ),
    });
    await expect(runManagedBootstrap(deps)).rejects.toThrow('realtime.messages');
    expect(calls).not.toContain('exec:transport');
    expect(calls).not.toContainEqual(expect.stringContaining('resolve:'));
  });

  it.each([
    ['no broadcast policy', []],
    ['an extra permissive SELECT policy', [broadcastPolicy(), broadcastPolicy({ policyname: 'broad read all', qual: 'true' })]],
    ['a wrong command', [broadcastPolicy({ cmd: 'ALL' })]],
    ['a missing authenticated role', [broadcastPolicy({ roles: ['anon'] })]],
    ['a drifted predicate', [broadcastPolicy({ qual: 'true' })]],
    ['an OR true predicate retaining expected markers', [broadcastPolicy({ qual: `(${EXPECTED_BROADCAST_PREDICATE}) OR true` })]],
    ['an additional anon role', [broadcastPolicy({ roles: ['authenticated', 'anon'] })]],
    ['a restrictive policy', [broadcastPolicy({ permissive: 'RESTRICTIVE' })]],
  ])('rejects policy inventory with %s', async (_label, policies) => {
    const calls: string[] = [];
    const finished = new Set(ALL_DIRS.filter((dir) => dir < AUTHORIZE_BROADCAST_MIGRATION));
    const { deps } = makeDeps({
      calls,
      finished,
      unfinished: [{ migration_name: AUTHORIZE_BROADCAST_MIGRATION, checksum: BROADCAST_CHECKSUM }],
      routes: healthyRoutes.map((r) =>
        r.match === `tablename = 'messages'` ? { ...r, rows: policies } : r,
      ),
    });
    await expect(runManagedBootstrap(deps)).rejects.toThrow('Postcondition failed');
    expect(calls).not.toContainEqual(expect.stringContaining('resolve:'));
  });

  it.each([
    { qual: "(bucket_id = 'foodflow-public'::text) OR true" },
    { roles: ['anon', 'authenticated', 'public'] },
  ])('rejects a broadened storage read policy %j', async (drift) => {
    const calls: string[] = [];
    const { deps } = makeDeps({
      calls,
      routes: healthyRoutes.map((r) => r.match === `tablename = 'objects'`
        ? { ...r, rows: [storageReadPolicy(drift)] } : r),
    });
    await expect(runManagedBootstrap(deps)).rejects.toThrow('Postcondition failed');
    expect(calls.filter((call) => call === `resolve:${AUTHORIZE_BROADCAST_MIGRATION}`)).toHaveLength(0);
  });

  it('rejects residual client grants on the outbox', async () => {
    const calls: string[] = [];
    const finished = new Set(ALL_DIRS.filter((dir) => dir < AUTHORIZE_BROADCAST_MIGRATION));
    const { deps } = makeDeps({
      calls,
      finished,
      unfinished: [{ migration_name: AUTHORIZE_BROADCAST_MIGRATION, checksum: BROADCAST_CHECKSUM }],
      routes: healthyRoutes.map((r) =>
        r.match === 'privilege_type'
          ? { ...r, rows: [{ grantee: 'anon', privilege_type: 'SELECT' }] }
          : r,
      ),
    });
    await expect(runManagedBootstrap(deps)).rejects.toThrow('retains client grants');
  });

  it('rejects when the outbox is still published', async () => {
    const calls: string[] = [];
    const finished = new Set(ALL_DIRS.filter((dir) => dir < AUTHORIZE_BROADCAST_MIGRATION));
    const { deps } = makeDeps({
      calls,
      finished,
      unfinished: [{ migration_name: AUTHORIZE_BROADCAST_MIGRATION, checksum: BROADCAST_CHECKSUM }],
      routes: healthyRoutes.map((r) =>
        r.match === `pubname = 'supabase_realtime'`
          ? { ...r, rows: [{ tablename: 'realtime_outbox' }] }
          : r,
      ),
    });
    await expect(runManagedBootstrap(deps)).rejects.toThrow('still in supabase_realtime publication');
  });

  it.each([
    ['non-unique index', [{ indisunique: false, indexdef: 'CREATE INDEX x (driver_profile_id) WHERE (status)::text = \'pending\'::text' }]],
    ['missing predicate', [{ indisunique: true, indexdef: 'CREATE UNIQUE INDEX x (driver_profile_id)' }]],
    ['missing index', []],
  ])('rejects kyc postcondition with %s', async (_label, rows) => {
    const calls: string[] = [];
    const { deps } = makeDeps({
      calls,
      routes: healthyRoutes.map((r) => (r.match === 'indisunique' ? { ...r, rows } : r)),
    });
    await expect(runManagedBootstrap(deps)).rejects.toThrow('Postcondition failed');
    expect(calls).not.toContainEqual(expect.stringContaining('resolve:'));
  });

  it.each([
    { key_columns: ['driver_profile_id', 'id'], attribute_count: 2 },
    { predicate: `(status = 'pending'::"KycStatus") OR (status = 'approved'::"KycStatus")` },
    { indisvalid: false },
    { no_expressions: false },
    { table_name: 'other_table' },
  ])('rejects structurally incorrect KYC index %j without resolution', async (drift) => {
    const calls: string[] = [];
    const good = healthyRoutes.find((r) => r.match === 'indisunique')!.rows[0] as Record<string, unknown>;
    const { deps } = makeDeps({ calls,
      routes: healthyRoutes.map((r) => r.match === 'indisunique' ? { ...r, rows: [{ ...good, ...drift }] } : r),
    });
    await expect(runManagedBootstrap(deps)).rejects.toThrow('Postcondition failed');
    expect(calls.filter((call) => call.startsWith('resolve:'))).toHaveLength(0);
  });

  it('uses listBuckets for existence and treats the real 404 getBucket shape as fatal', async () => {
    const calls: string[] = [];
    const buckets = new Map<string, Record<string, unknown>>();
    const { deps, storage } = makeDeps({ calls, buckets });
    await runManagedBootstrap(deps);
    // creation happened without ever consulting getBucket first for existence
    const createIdx = calls.indexOf('api:createBucket:foodflow-kyc');
    expect(createIdx).toBeGreaterThan(-1);
    const firstGet = calls.indexOf('api:getBucket:foodflow-kyc');
    expect(firstGet).toBeGreaterThan(createIdx);
    expect(storage.createBucket).toHaveBeenCalled();
  });

  it('fails closed when listBuckets inventory errors', async () => {
    const calls: string[] = [];
    const { deps } = makeDeps({ calls, storageOverrides: { listBuckets: { message: 'forbidden' } } });
    await expect(runManagedBootstrap(deps)).rejects.toThrow('Unable to list Supabase Storage buckets');
    expect(calls).not.toContain('api:createBucket:foodflow-kyc');
  });

  it('propagates createBucket failure without resolving', async () => {
    const calls: string[] = [];
    const { deps } = makeDeps({ calls, storageOverrides: { createBucket: { message: 'quota' } } });
    await expect(runManagedBootstrap(deps)).rejects.toThrow('Failed to create Storage bucket');
    expect(calls).not.toContainEqual(expect.stringContaining('resolve:'));
  });

  it('enforces predecessor creators before legacy cleanup', async () => {
    const calls: string[] = [];
    const finished = new Set(
      ALL_DIRS.filter(
        (dir) => dir < REMOVE_LEGACY_BUCKETS_MIGRATION && dir !== SECURE_DRIVER_KYC_MIGRATION,
      ),
    );
    const { deps } = makeDeps({
      calls,
      finished,
      unfinished: [
        {
          migration_name: REMOVE_LEGACY_BUCKETS_MIGRATION,
          checksum: '16a7d29feb5d6e13827fd60785e978c75f7570aff5202a14206b9359ccd62a10',
        },
      ],
      buckets: new Map([['foodflow-kyc', {}]]),
    });
    await expect(runManagedBootstrap(deps)).rejects.toThrow(
      'Refusing cleanup before predecessor creators finished',
    );
    expect(calls).not.toContain('api:deleteBucket:foodflow-kyc');
  });

  it('refuses to delete a nonempty legacy bucket', async () => {
    const calls: string[] = [];
    const finished = new Set(ALL_DIRS.filter((dir) => dir < REMOVE_LEGACY_BUCKETS_MIGRATION));
    const { deps } = makeDeps({
      calls,
      finished,
      unfinished: [
        {
          migration_name: REMOVE_LEGACY_BUCKETS_MIGRATION,
          checksum: '16a7d29feb5d6e13827fd60785e978c75f7570aff5202a14206b9359ccd62a10',
        },
      ],
      buckets: new Map([['foodflow-kyc', {}]]),
      storageOverrides: { deleteBucket: { message: 'Bucket not empty' } },
    });
    await expect(runManagedBootstrap(deps)).rejects.toThrow(
      'Refusing to remove legacy Storage bucket foodflow-kyc',
    );
    expect(calls).not.toContainEqual(expect.stringContaining('resolve:'));
  });

  it('keeps earlier completed receipts when a later checkpoint fails', async () => {
    const calls: string[] = [];
    const finished = new Set(ALL_DIRS.filter((dir) => dir < AUTHORIZE_BROADCAST_MIGRATION));
    const { deps } = makeDeps({
      calls,
      unfinished: [{ migration_name: AUTHORIZE_BROADCAST_MIGRATION, checksum: BROADCAST_CHECKSUM }],
      finished,
      buckets: new Map([['foodflow-kyc', {}]]),
      storageOverrides: { deleteBucket: { message: 'provider down' } },
    });
    // broadcast resolves fine; the later cleanup checkpoint fails at the API
    await expect(runManagedBootstrap(deps)).rejects.toThrow(
      'Refusing to remove legacy Storage bucket foodflow-kyc',
    );
    const logs = (deps.log as jest.Mock).mock.calls.map((c) => JSON.parse(c[0]));
    const completed = logs.filter((l) => l.status === 'completed');
    expect(completed.map((l) => l.migrationName)).toEqual([AUTHORIZE_BROADCAST_MIGRATION]);
    // the earlier verified work is still on the record — no silent loss
    expect(completed[0].canonicalChecksum).toBe(
      createHash('sha256').update(await realMigrationSql(AUTHORIZE_BROADCAST_MIGRATION)).digest('hex'),
    );
  });
});
