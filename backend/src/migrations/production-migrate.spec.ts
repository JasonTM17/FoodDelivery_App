import {
  deleteEmptyLegacyBuckets,
  main,
  needsMigrationResolution,
} from './production-migrate';
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

  it('blocks provider mutation when an applied checksum differs locally', async () => {
    const appliedAt = new Date('2026-07-15T00:00:00Z');
    const mismatches = migrationChecksumGuard.findAppliedMigrationChecksumMismatches(
      [
        {
          migration_name: '20260709143000_add_realtime_outbox',
          checksum: 'production-checksum',
          finished_at: appliedAt,
          rolled_back_at: null,
        },
        {
          migration_name: 'rolled_back_migration',
          checksum: 'different-checksum',
          finished_at: appliedAt,
          rolled_back_at: appliedAt,
        },
      ],
      new Map([
        ['20260709143000_add_realtime_outbox', 'local-checksum'],
        ['rolled_back_migration', 'local-checksum'],
      ]),
    );

    expect(mismatches).toEqual(['20260709143000_add_realtime_outbox']);

    const originalStorageProvider = process.env.STORAGE_PROVIDER;
    process.env.STORAGE_PROVIDER = 'supabase';
    const guard = jest
      .spyOn(migrationChecksumGuard, 'assertAppliedMigrationChecksums')
      .mockRejectedValue(
        new Error(
          'Applied migration checksum mismatch: 20260709143000_add_realtime_outbox',
        ),
      );

    try {
      await expect(main()).rejects.toThrow(
        'Applied migration checksum mismatch: 20260709143000_add_realtime_outbox',
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
