import { PrismaClient } from '@prisma/client';
import { assertAppliedMigrationChecksums } from '../src/migrations/migration-checksum-guard';

/**
 * Read-only provenance check for the database targeted by injected Railway
 * variables. It intentionally performs no Storage or schema mutation.
 */
async function main(): Promise<void> {
  const prisma = new PrismaClient();
  try {
    await assertAppliedMigrationChecksums(prisma, {
      requireMigrationTable: true,
    });
    const rows = await prisma.$queryRaw<
      Array<{
        migration_name: string;
        finished_at: Date | null;
        rolled_back_at: Date | null;
      }>
    >`
      SELECT migration_name, finished_at, rolled_back_at
      FROM "_prisma_migrations"
      ORDER BY started_at ASC
    `;
    const activeApplied = rows.filter(
      (row) => row.finished_at !== null && row.rolled_back_at === null,
    );
    console.log(
      JSON.stringify({
        checksumStatus: 'ok',
        activeAppliedMigrations: activeApplied.length,
      }),
    );
  } catch (error: unknown) {
    console.error(error instanceof Error ? error.message : 'Migration audit failed');
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
}

void main();
