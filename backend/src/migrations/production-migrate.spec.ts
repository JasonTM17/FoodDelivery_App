import {
  deleteEmptyLegacyBuckets,
  main,
  needsMigrationResolution,
} from './production-migrate';
import { APPROVED_MIGRATION_CHECKSUM_EXCEPTIONS } from './migration-checksum-exceptions';
import * as migrationChecksumGuard from './migration-checksum-guard';

describe('production migrate Storage cleanup', () => {
  it('deletes only legacy buckets that exist', async () => {
    const listBuckets = jest.fn().mockResolvedValue({
      data: [
        { id: 'foodflow-public' },
        { id: 'foodflow-production' },
      ],
      error: null,
    });
    const deleteBucket = jest.fn().mockResolvedValue({ data: {}, error: null });

    await expect(
      deleteEmptyLegacyBuckets({ listBuckets, deleteBucket }),
    ).resolves.toEqual(['foodflow-production']);
    expect(deleteBucket).toHaveBeenCalledTimes(1);
    expect(deleteBucket).toHaveBeenCalledWith('foodflow-production');
  });

  it('fails closed instead of emptying a bucket with data', async () => {
    const storage = {
      listBuckets: jest.fn().mockResolvedValue({
        data: [{ id: 'foodflow-kyc' }],
        error: null,
      }),
      deleteBucket: jest.fn().mockResolvedValue({
        data: null,
        error: { message: 'Bucket not empty' },
      }),
    };

    await expect(deleteEmptyLegacyBuckets(storage)).rejects.toThrow(
      'Refusing to remove legacy Storage bucket foodflow-kyc: Bucket not empty',
    );
  });

  it('stops when the bucket inventory cannot be verified', async () => {
    const storage = {
      listBuckets: jest.fn().mockResolvedValue({
        data: null,
        error: { message: 'Storage unavailable' },
      }),
      deleteBucket: jest.fn(),
    };

    await expect(deleteEmptyLegacyBuckets(storage)).rejects.toThrow(
      'Unable to list Supabase Storage buckets: Storage unavailable',
    );
    expect(storage.deleteBucket).not.toHaveBeenCalled();
  });

  it('resolves only when no successful migration record exists', () => {
    expect(needsMigrationResolution([])).toBe(true);
    expect(
      needsMigrationResolution([{ finished_at: null, rolled_back_at: null }]),
    ).toBe(true);
    expect(
      needsMigrationResolution([
        { finished_at: new Date('2026-07-15T00:00:00Z'), rolled_back_at: null },
      ]),
    ).toBe(false);
    expect(
      needsMigrationResolution([
        {
          finished_at: new Date('2026-07-15T00:00:00Z'),
          rolled_back_at: new Date('2026-07-15T00:01:00Z'),
        },
      ]),
    ).toBe(true);
  });

  it('accepts only the exact recovered checksum provenance pair', async () => {
    const appliedAt = new Date('2026-07-15T00:00:00Z');
    const approved = migrationChecksumGuard.findAppliedMigrationChecksumMismatches(
      [
        {
          migration_name: 'recovered-migration',
          checksum: 'production-checksum',
          finished_at: appliedAt,
          rolled_back_at: null,
        },
      ],
      new Map([['recovered-migration', 'source-checksum']]),
      {
        'recovered-migration': {
          productionChecksum: 'production-checksum',
          sourceChecksum: 'source-checksum',
          evidence: 'test artifact',
        },
      },
    );
    expect(approved).toEqual([]);

    const recoveredRows = Object.entries(
      APPROVED_MIGRATION_CHECKSUM_EXCEPTIONS,
    ).map(([migration_name, exception]) => ({
      migration_name,
      checksum: exception.productionChecksum,
      finished_at: appliedAt,
      rolled_back_at: null,
    }));
    const recoveredSources = new Map(
      Object.entries(APPROVED_MIGRATION_CHECKSUM_EXCEPTIONS).map(
        ([migrationName, exception]) => [
          migrationName,
          exception.sourceChecksum,
        ],
      ),
    );
    expect(
      migrationChecksumGuard.findAppliedMigrationChecksumMismatches(
        recoveredRows,
        recoveredSources,
      ),
    ).toEqual([]);

    const changedRecoveredRow = recoveredRows[0];
    expect(changedRecoveredRow).toBeDefined();
    if (changedRecoveredRow) {
      changedRecoveredRow.checksum = `${changedRecoveredRow.checksum}-changed`;
    }
    expect(
      migrationChecksumGuard.findAppliedMigrationChecksumMismatches(
        recoveredRows,
        recoveredSources,
      ),
    ).toEqual([recoveredRows[0]?.migration_name]);

    const unapproved = migrationChecksumGuard.findAppliedMigrationChecksumMismatches(
      [
        {
          migration_name: 'recovered-migration',
          checksum: 'unexpected-production-checksum',
          finished_at: appliedAt,
          rolled_back_at: null,
        },
      ],
      new Map([['recovered-migration', 'source-checksum']]),
      {
        'recovered-migration': {
          productionChecksum: 'production-checksum',
          sourceChecksum: 'source-checksum',
          evidence: 'test artifact',
        },
      },
    );
    expect(unapproved).toEqual(['recovered-migration']);

    const originalStorageProvider = process.env.STORAGE_PROVIDER;
    process.env.STORAGE_PROVIDER = 'supabase';
    const guard = jest
      .spyOn(migrationChecksumGuard, 'assertAppliedMigrationChecksums')
      .mockRejectedValue(new Error('Applied migration checksum mismatch'));
    try {
      await expect(main()).rejects.toThrow(
        'Applied migration checksum mismatch',
      );
    } finally {
      guard.mockRestore();
      if (originalStorageProvider === undefined) {
        delete process.env.STORAGE_PROVIDER;
      } else {
        process.env.STORAGE_PROVIDER = originalStorageProvider;
      }
    }
  });
});
