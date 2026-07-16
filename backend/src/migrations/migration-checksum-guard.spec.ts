import {
  assertAppliedMigrationChecksums,
  createMigrationChecksumVariants,
  findAppliedMigrationChecksumMismatches,
  type AppliedMigrationChecksum,
} from './migration-checksum-guard';
import type { PrismaClient } from '@prisma/client';
import { APPROVED_MIGRATION_CHECKSUM_PROVENANCE } from './approved-migration-checksum-provenance';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

describe('migration checksum guard', () => {
  it('fails closed when production provider mutation has no history table', async () => {
    const prisma = {
      $queryRaw: jest.fn().mockResolvedValue([{ exists: false }]),
    } as unknown as PrismaClient;

    await expect(
      assertAppliedMigrationChecksums(prisma, { requireMigrationTable: true }),
    ).rejects.toThrow(
      'Prisma migration history is missing; refusing production provider mutation',
    );
  });

  it('allows Prisma to initialize an empty database when no provider mutates', async () => {
    const prisma = {
      $queryRaw: jest.fn().mockResolvedValue([{ exists: false }]),
    } as unknown as PrismaClient;

    await expect(assertAppliedMigrationChecksums(prisma)).resolves.toBeUndefined();
  });

  it('treats LF and CRLF as equivalent without accepting content drift', () => {
    const lfChecksums = createMigrationChecksumVariants('SELECT 1;\nSELECT 2;\n');
    const crlfChecksums = createMigrationChecksumVariants(
      'SELECT 1;\r\nSELECT 2;\r\n',
    );
    const changedChecksums = createMigrationChecksumVariants(
      'SELECT 1;\nSELECT 3;\n',
    );

    expect(crlfChecksums).toEqual(lfChecksums);
    expect(
      [...changedChecksums].some((checksum) => lfChecksums.has(checksum)),
    ).toBe(false);
  });

  it('keeps the production Storage migration byte-compatible', () => {
    const migrationSql = readFileSync(
      join(
        process.cwd(),
        'prisma',
        'migrations',
        '20260712143000_add_production_storage_bucket',
        'migration.sql',
      ),
      'utf8',
    );

    expect(createMigrationChecksumVariants(migrationSql)).toContain(
      '4664ac4299eea854a16316be6a9ed689a3320c1fca2557a4fd00f011368fd8e6',
    );
  });

  it('blocks applied checksum drift and missing local migrations', () => {
    const appliedAt = new Date('2026-07-15T00:00:00Z');
    const applied: AppliedMigrationChecksum[] = [
      {
        migration_name: '20260709143000_add_realtime_outbox',
        checksum: 'production-checksum',
        finished_at: appliedAt,
        rolled_back_at: null,
      },
      {
        migration_name: '20260713071000_add_rag_embedding_hnsw_index',
        checksum: 'ghost-checksum',
        finished_at: appliedAt,
        rolled_back_at: null,
      },
      {
        migration_name: 'rolled_back_migration',
        checksum: 'different-checksum',
        finished_at: appliedAt,
        rolled_back_at: appliedAt,
      },
    ];

    expect(
      findAppliedMigrationChecksumMismatches(
        applied,
        new Map([
          ['20260709143000_add_realtime_outbox', new Set(['local-checksum'])],
        ]),
      ),
    ).toEqual([
      '20260709143000_add_realtime_outbox',
      '20260713071000_add_rag_embedding_hnsw_index',
    ]);
  });

  it('accepts every exact checksum recovered from approved immutable images', () => {
    const appliedAt = new Date('2026-07-15T00:00:00Z');
    const applied: AppliedMigrationChecksum[] =
      APPROVED_MIGRATION_CHECKSUM_PROVENANCE.map((provenance) => ({
        migration_name: provenance.migrationName,
        checksum: provenance.checksum,
        finished_at: appliedAt,
        rolled_back_at: null,
      }));

    expect(
      findAppliedMigrationChecksumMismatches(
        applied,
        new Map(
          APPROVED_MIGRATION_CHECKSUM_PROVENANCE.map((provenance) => [
            provenance.migrationName,
            new Set([provenance.reviewedLocalChecksum]),
          ]),
        ),
      ),
    ).toEqual([]);
  });

  it('binds every historical approval to the reviewed local migration bytes', () => {
    for (const provenance of APPROVED_MIGRATION_CHECKSUM_PROVENANCE) {
      const migrationSql = readFileSync(
        join(
          process.cwd(),
          'prisma',
          'migrations',
          provenance.migrationName,
          'migration.sql',
        ),
        'utf8',
      );

      expect(createMigrationChecksumVariants(migrationSql)).toContain(
        provenance.reviewedLocalChecksum,
      );
    }
  });

  it('revokes historical approval when the reviewed local migration changes', () => {
    const appliedAt = new Date('2026-07-15T00:00:00Z');
    const [approvedRealtime] = APPROVED_MIGRATION_CHECKSUM_PROVENANCE;

    expect(
      findAppliedMigrationChecksumMismatches(
        [
          {
            migration_name: approvedRealtime.migrationName,
            checksum: approvedRealtime.checksum,
            finished_at: appliedAt,
            rolled_back_at: null,
          },
        ],
        new Map([
          [approvedRealtime.migrationName, new Set(['changed-local-checksum'])],
        ]),
      ),
    ).toEqual([approvedRealtime.migrationName]);
  });

  it('does not let provenance approve another checksum or a missing local migration', () => {
    const appliedAt = new Date('2026-07-15T00:00:00Z');
    const [approvedRealtime] = APPROVED_MIGRATION_CHECKSUM_PROVENANCE;
    const applied: AppliedMigrationChecksum[] = [
      {
        migration_name: approvedRealtime.migrationName,
        checksum: 'unapproved-checksum',
        finished_at: appliedAt,
        rolled_back_at: null,
      },
      {
        migration_name: '20260712143000_add_production_storage_bucket',
        checksum:
          '4664ac4299eea854a16316be6a9ed689a3320c1fca2557a4fd00f011368fd8e6',
        finished_at: appliedAt,
        rolled_back_at: null,
      },
      {
        migration_name: 'missing_local_migration',
        checksum: approvedRealtime.checksum,
        finished_at: appliedAt,
        rolled_back_at: null,
      },
    ];

    expect(
      findAppliedMigrationChecksumMismatches(
        applied,
        new Map([
          [approvedRealtime.migrationName, new Set(['current-checksum'])],
          [
            '20260712143000_add_production_storage_bucket',
            new Set(['current-storage-checksum']),
          ],
        ]),
      ),
    ).toEqual([
      approvedRealtime.migrationName,
      '20260712143000_add_production_storage_bucket',
      'missing_local_migration',
    ]);
  });

  it('accepts matching active records and ignores rolled-back records', () => {
    const appliedAt = new Date('2026-07-15T00:00:00Z');
    expect(
      findAppliedMigrationChecksumMismatches(
        [
          {
            migration_name: 'active_migration',
            checksum: 'same',
            finished_at: appliedAt,
            rolled_back_at: null,
          },
          {
            migration_name: 'rolled_back_migration',
            checksum: 'different',
            finished_at: appliedAt,
            rolled_back_at: appliedAt,
          },
          {
            migration_name: 'failed_migration',
            checksum: 'different',
            finished_at: null,
            rolled_back_at: null,
          },
        ],
        new Map([['active_migration', new Set(['same'])]]),
      ),
    ).toEqual([]);
  });

});
