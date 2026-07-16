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

export type ApprovedHistoricalMigrationChecksum = {
  migrationName: string;
  recordedChecksum: string;
  canonicalLocalChecksum: string;
};

/**
 * These three rows predate immutable migration enforcement. Their recorded
 * digests were read from production on 2026-07-16 and do not match any blob in
 * the retained Git history. Rewriting an applied migration or using
 * `migrate resolve` would destroy more provenance. Each exception therefore
 * pins both the exact production digest and the canonical LF digest currently
 * reviewed in source; changing either side fails closed.
 */
export const APPROVED_HISTORICAL_MIGRATION_CHECKSUMS: readonly ApprovedHistoricalMigrationChecksum[] = [
  {
    migrationName: '20260709143000_add_realtime_outbox',
    recordedChecksum: '3f9705062cd288d93484e62d3afa98e3e5d9190941a9a1d62af8169eafb325a7',
    canonicalLocalChecksum: '40baeeddc6f209a7bbd257ba3acf07dad1be43cd34c7212f0457e945c48751c5',
  },
  {
    migrationName: '20260709150000_add_job_outbox',
    recordedChecksum: '72d4edd8a9a2397e604b38438025670f4b35d8beb7008ff0ae33157df58a7bdf',
    canonicalLocalChecksum: 'fe1716c645dee3d50df92bce488cdaa2a854ea55e5459e877a8f6087974aeef3',
  },
  {
    migrationName: '20260712143000_add_production_storage_bucket',
    recordedChecksum: '4664ac4299eea854a16316be6a9ed689a3320c1fca2557a4fd00f011368fd8e6',
    canonicalLocalChecksum: 'a0812428130e34a0204d48b6227a98468105642e6b50dc8713f4a47d709c0d4f',
  },
];

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
  approvedHistoricalChecksums: readonly ApprovedHistoricalMigrationChecksum[] = APPROVED_HISTORICAL_MIGRATION_CHECKSUMS,
): string[] {
  return appliedMigrations
    .filter(
      (migration) =>
        migration.finished_at !== null && migration.rolled_back_at === null,
    )
    .filter(
      (migration) => {
        const migrationChecksums = localChecksums.get(migration.migration_name);
        if (migrationChecksums?.has(migration.checksum)) return false;

        const approved = approvedHistoricalChecksums.find(
          (candidate) =>
            candidate.migrationName === migration.migration_name &&
            candidate.recordedChecksum === migration.checksum,
        );
        return !approved || !migrationChecksums?.has(approved.canonicalLocalChecksum);
      },
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
