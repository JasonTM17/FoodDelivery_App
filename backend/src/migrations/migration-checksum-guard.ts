import { createHash } from 'node:crypto';
import { readFile, readdir } from 'node:fs/promises';
import { join } from 'node:path';
import { PrismaClient } from '@prisma/client';

export type AppliedMigrationChecksum = {
  migration_name: string;
  checksum: string;
  finished_at: Date | null;
  rolled_back_at: Date | null;
};

export type LocalMigrationChecksums = ReadonlyMap<
  string,
  ReadonlySet<string>
>;

export type MigrationChecksumGuardOptions = {
  requireMigrationTable?: boolean;
};

export function createMigrationChecksumVariants(sql: string): ReadonlySet<string> {
  const lfSql = sql.replace(/\r\n/g, '\n');
  const crlfSql = lfSql.replace(/\n/g, '\r\n');

  return new Set(
    [sql, lfSql, crlfSql].map((variant) =>
      createHash('sha256').update(variant).digest('hex'),
    ),
  );
}

/**
 * Return only successful, non-rolled-back migrations whose recorded checksum
 * differs from the migration SQL shipped in this image.
 */
export function findAppliedMigrationChecksumMismatches(
  appliedMigrations: AppliedMigrationChecksum[],
  localChecksums: LocalMigrationChecksums,
): string[] {
  return appliedMigrations
    .filter(
      (migration) =>
        migration.finished_at !== null && migration.rolled_back_at === null,
    )
    .filter(
      (migration) =>
        !localChecksums
          .get(migration.migration_name)
          ?.has(migration.checksum),
    )
    .map((migration) => migration.migration_name);
}

async function loadLocalMigrationChecksums(): Promise<
  Map<string, ReadonlySet<string>>
> {
  const migrationsDirectory = join(process.cwd(), 'prisma', 'migrations');
  const entries = await readdir(migrationsDirectory, { withFileTypes: true });
  const checksums = new Map<string, ReadonlySet<string>>();

  for (const entry of entries) {
    if (!entry.isDirectory()) {
      continue;
    }

    const migrationPath = join(
      migrationsDirectory,
      entry.name,
      'migration.sql',
    );
    // Production history can contain files created on either Windows (CRLF)
    // or Linux (LF). Accept only line-ending variants of this exact SQL; any
    // content change still produces a checksum mismatch and blocks rollout.
    const rawSql = await readFile(migrationPath, 'utf8');
    checksums.set(entry.name, createMigrationChecksumVariants(rawSql));
  }

  return checksums;
}

async function hasPrismaMigrationTable(prisma: PrismaClient): Promise<boolean> {
  const [result] = await prisma.$queryRaw<Array<{ exists: boolean }>>`
    SELECT to_regclass('"_prisma_migrations"') IS NOT NULL AS "exists"
  `;
  return result?.exists === true;
}

/**
 * Fail before Storage API calls or `prisma migrate deploy` when applied
 * migration provenance differs from the immutable image source.
 */
export async function assertAppliedMigrationChecksums(
  prisma: PrismaClient,
  options: MigrationChecksumGuardOptions = {},
): Promise<void> {
  if (!(await hasPrismaMigrationTable(prisma))) {
    if (options.requireMigrationTable) {
      throw new Error(
        'Prisma migration history is missing; refusing production provider mutation',
      );
    }
    return;
  }

  const appliedMigrations = await prisma.$queryRaw<
    AppliedMigrationChecksum[]
  >`
    SELECT migration_name, checksum, finished_at, rolled_back_at
    FROM "_prisma_migrations"
    ORDER BY started_at ASC
  `;
  const mismatches = findAppliedMigrationChecksumMismatches(
    appliedMigrations,
    await loadLocalMigrationChecksums(),
  );

  if (mismatches.length > 0) {
    throw new Error(
      `Applied migration checksum mismatch: ${mismatches.join(', ')}`,
    );
  }
}
