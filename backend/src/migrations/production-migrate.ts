import { spawn } from 'node:child_process';
import { join } from 'node:path';
import { PrismaClient } from '@prisma/client';
import { createClient } from '@supabase/supabase-js';

export const LEGACY_BUCKETS = ['foodflow-kyc', 'foodflow-production'] as const;
export const STORAGE_CLEANUP_MIGRATION =
  '20260715010000_remove_empty_legacy_storage_buckets';

type MigrationState = {
  finished_at: Date | null;
  rolled_back_at: Date | null;
};

type StorageError = { message: string } | null;

export type StorageBucketApi = {
  listBuckets(): Promise<{
    data: Array<{ id: string }> | null;
    error: StorageError;
  }>;
  deleteBucket(bucketId: string): Promise<{
    error: StorageError;
  }>;
};

export async function deleteEmptyLegacyBuckets(
  storage: StorageBucketApi,
): Promise<string[]> {
  const { data: buckets, error: listError } = await storage.listBuckets();
  if (listError || !buckets) {
    throw new Error(
      `Unable to list Supabase Storage buckets: ${listError?.message ?? 'empty response'}`,
    );
  }

  const existingBucketIds = new Set(buckets.map((bucket) => bucket.id));
  const deletedBuckets: string[] = [];

  for (const bucketId of LEGACY_BUCKETS) {
    if (!existingBucketIds.has(bucketId)) {
      continue;
    }

    // Supabase rejects deleteBucket when objects remain. Never call emptyBucket:
    // an unexpected object is a release blocker, not data to discard.
    const { error: deleteError } = await storage.deleteBucket(bucketId);
    if (deleteError) {
      throw new Error(
        `Refusing to remove legacy Storage bucket ${bucketId}: ${deleteError.message}`,
      );
    }
    deletedBuckets.push(bucketId);
  }

  return deletedBuckets;
}

export function needsMigrationResolution(
  states: MigrationState[],
): boolean {
  return !states.some(
    (state) => state.finished_at !== null && state.rolled_back_at === null,
  );
}

async function hasPrismaMigrationTable(prisma: PrismaClient): Promise<boolean> {
  const [result] = await prisma.$queryRaw<Array<{ exists: boolean }>>`
    SELECT to_regclass('"_prisma_migrations"') IS NOT NULL AS "exists"
  `;
  return result?.exists === true;
}

async function getMigrationStates(
  prisma: PrismaClient,
): Promise<MigrationState[]> {
  if (!(await hasPrismaMigrationTable(prisma))) {
    return [];
  }
  return prisma.$queryRaw<MigrationState[]>`
    SELECT finished_at, rolled_back_at
    FROM "_prisma_migrations"
    WHERE migration_name = ${STORAGE_CLEANUP_MIGRATION}
    ORDER BY started_at DESC
  `;
}

async function runPrisma(arguments_: string[]): Promise<void> {
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

async function prepareSupabaseStorage(prisma: PrismaClient): Promise<void> {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseSecretKey = process.env.SUPABASE_SECRET_KEY;
  if (!supabaseUrl || !supabaseSecretKey) {
    throw new Error(
      'SUPABASE_URL and SUPABASE_SECRET_KEY are required for Supabase migrations',
    );
  }

  const supabase = createClient(supabaseUrl, supabaseSecretKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const deletedBuckets = await deleteEmptyLegacyBuckets(supabase.storage);
  console.log(
    deletedBuckets.length === 0
      ? 'Legacy Supabase Storage buckets already absent'
      : `Removed empty legacy Supabase Storage buckets: ${deletedBuckets.join(', ')}`,
  );

  const states = await getMigrationStates(prisma);

  if (needsMigrationResolution(states)) {
    await prisma.$disconnect();
    await runPrisma([
      'migrate',
      'resolve',
      '--applied',
      STORAGE_CLEANUP_MIGRATION,
      '--schema',
      'prisma/schema.prisma',
    ]);
  }
}

export async function main(): Promise<void> {
  const prisma = new PrismaClient();
  try {
    if (process.env.STORAGE_PROVIDER === 'supabase') {
      await prepareSupabaseStorage(prisma);
    }
  } finally {
    await prisma.$disconnect();
  }

  await runPrisma([
    'migrate',
    'deploy',
    '--schema',
    'prisma/schema.prisma',
  ]);
}

if (require.main === module) {
  void main().catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  });
}
