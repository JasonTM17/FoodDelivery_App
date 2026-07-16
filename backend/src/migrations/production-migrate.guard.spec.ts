const assertAppliedMigrationChecksums = jest.fn().mockRejectedValue(
  new Error('Applied migration checksum mismatch: drifted_migration'),
);
const disconnect = jest.fn().mockResolvedValue(undefined);
const createClient = jest.fn();

jest.mock('./migration-checksum-guard', () => ({
  assertAppliedMigrationChecksums,
}));
jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn().mockImplementation(() => ({ $disconnect: disconnect })),
}));
jest.mock('@supabase/supabase-js', () => ({ createClient }));

import { main } from './production-migrate';

describe('production migration guard ordering', () => {
  const originalStorageProvider = process.env.STORAGE_PROVIDER;

  afterEach(() => {
    jest.clearAllMocks();
    if (originalStorageProvider === undefined) {
      delete process.env.STORAGE_PROVIDER;
    } else {
      process.env.STORAGE_PROVIDER = originalStorageProvider;
    }
  });

  it('blocks before Supabase Storage mutation or Prisma deploy', async () => {
    process.env.STORAGE_PROVIDER = 'supabase';

    await expect(main()).rejects.toThrow(
      'Applied migration checksum mismatch: drifted_migration',
    );

    expect(assertAppliedMigrationChecksums).toHaveBeenCalledWith(
      expect.anything(),
      { requireMigrationTable: true },
    );
    expect(createClient).not.toHaveBeenCalled();
    expect(disconnect).toHaveBeenCalledTimes(1);
  });
});
