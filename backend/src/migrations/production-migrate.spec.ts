import {
  deleteEmptyLegacyBuckets,
  needsMigrationResolution,
} from './production-migrate';
import { findAppliedMigrationChecksumMismatches } from './migration-checksum-guard';

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

  it('blocks provider mutation when an applied migration checksum changed', () => {
    expect(
      findAppliedMigrationChecksumMismatches(
        [
          { migration_name: '20260709143000_add_realtime_outbox', checksum: 'production' },
          { migration_name: '20260709150000_add_job_outbox', checksum: 'same' },
        ],
        {
          '20260709143000_add_realtime_outbox': 'local',
          '20260709150000_add_job_outbox': 'same',
        },
      ),
    ).toEqual(['20260709143000_add_realtime_outbox']);
  });
});
