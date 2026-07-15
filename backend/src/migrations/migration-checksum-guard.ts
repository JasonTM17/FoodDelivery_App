import { createHash } from 'node:crypto';
import { readFile, readdir } from 'node:fs/promises';
import { join } from 'node:path';
import { PrismaClient } from '@prisma/client';
import {
  APPROVED_MIGRATION_CHECKSUM_EXCEPTIONS,
  type ApprovedMigrationChecksumException,
} from './migration-checksum-exceptions';

export type AppliedMigrationChecksum = {
  migration_name: string;
  checksum: string;
  finished_at: Date | null;
  rolled_back_at: Date | null;
};

export function findAppliedMigrationChecksumMismatches(
  appliedMigrations: AppliedMigrationChecksum[],
  localChecksums: ReadonlyMap<string, string>,
  approvedExceptions: Readonly<
    Record<string, ApprovedMigrationChecksumException>
  > = APPROVED_MIGRATION_CHECKSUM_EXCEPTIONS,
): string[] {
  return appliedMigrations
    .filter(
      (migration) =>
        migration.finished_at !== null && migration.rolled_back_at === null,
    )
    .filter((migration) => {
      const localChecksum = localChecksums.get(migration.migration_name);
      if (localChecksum === migration.checksum) {
        return false;
      }

      const approved = approvedExceptions[migration.migration_name];
      return !(
        approved?.productionChecksum === migration.checksum &&
        approved.sourceChecksum === localChecksum
      );
    })
    .map((migration) => migration.migration_name);
}

async function loadLocalMigrationChecksums(): Promise<Map<string, string>> {
  const migrationsDirectory = join(process.cwd(), 'prisma', 'migrations');
  const entries = await readdir(migrationsDirectory, { withFileTypes: true });
  const checksums = new Map<string, string>();

  for (const entry of entries) {
    if (!entry.isDirectory()) {
      continue;
    }

    const migrationPath = join(
      migrationsDirectory,
      entry.name,
      'migration.sql',
    );
    const migrationSql = await readFile(migrationPath, 'utf8');
    const canonicalSql = migrationSql.replace(/\r\n/g, '\n');
    checksums.set(
      entry.name,
      createHash('sha256').update(canonicalSql).digest('hex'),
    );
  }

  return checksums;
}

async function hasPrismaMigrationTable(prisma: PrismaClient): Promise<boolean> {
  const [result] = await prisma.$queryRaw<Array<{ exists: boolean }>>`
    SELECT to_regclass('"_prisma_migrations"') IS NOT NULL AS "exists"
  `;
  return result?.exists === true;
}

export async function assertAppliedMigrationChecksums(
  prisma: PrismaClient,
): Promise<void> {
  if (!(await hasPrismaMigrationTable(prisma))) {
    return;
  }

  const appliedMigrations = await prisma.$queryRaw<
    AppliedMigrationChecksum[]
  >`
    SELECT migration_name, checksum, finished_at, rolled_back_at
    FROM "_prisma_migrations"
    ORDER BY started_at ASC
  `;
  const localChecksums = await loadLocalMigrationChecksums();
  const mismatches = findAppliedMigrationChecksumMismatches(
    appliedMigrations,
    localChecksums,
  );

  if (mismatches.length > 0) {
    throw new Error(
      `Applied migration checksum mismatch: ${mismatches.join(', ')}`,
    );
  }
}
