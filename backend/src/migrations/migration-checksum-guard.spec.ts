import {
  assertAppliedMigrationChecksums,
  createMigrationChecksumVariants,
  findAppliedMigrationChecksumMismatches,
  type AppliedMigrationChecksum,
} from './migration-checksum-guard';
import type { PrismaClient } from '@prisma/client';

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
