export type ApprovedMigrationChecksumException = {
  productionChecksum: string;
  sourceChecksum: string;
  evidence: string;
};

/**
 * Exact provenance pairs recovered from immutable migrator artifacts.
 *
 * These are not blanket bypasses: the guard accepts an entry only when both
 * the database checksum and the current canonical source checksum match.
 */
export const APPROVED_MIGRATION_CHECKSUM_EXCEPTIONS: Readonly<
  Record<string, ApprovedMigrationChecksumException>
> = {
  '20260709143000_add_realtime_outbox': {
    productionChecksum:
      '3f9705062cd288d93484e62d3afa98e3e5d9190941a9a1d62af8169eafb325a7',
    sourceChecksum:
      '40baeeddc6f209a7bbd257ba3acf07dad1be43cd34c7212f0457e945c48751c5',
    evidence:
      'foodflow-migrate:sha-1f761a65b4a7053858a512bf6eb09a3fd2adbef0 artifact; SQL content matches and only dirty line endings differ',
  },
  '20260709150000_add_job_outbox': {
    productionChecksum:
      '72d4edd8a9a2397e604b38438025670f4b35d8beb7008ff0ae33157df58a7bdf',
    sourceChecksum:
      '1b85653815a9c7a228bf49eedeaff15efffeda76177988727b4f098a259d4606',
    evidence:
      'foodflow-migrate:sha-1f761a65b4a7053858a512bf6eb09a3fd2adbef0 artifact; original SQL/comment restored and only dirty line endings differ',
  },
  '20260712143000_add_production_storage_bucket': {
    productionChecksum:
      '4664ac4299eea854a16316be6a9ed689a3320c1fca2557a4fd00f011368fd8e6',
    sourceChecksum:
      'a0812428130e34a0204d48b6227a98468105642e6b50dc8713f4a47d709c0d4f',
    evidence:
      'Git object c29c069ea180ed6c3107411759b8ceb2150dc8e7; only a recovered trailing blank line differs, so the canonical source stays clean and the exact pair is allow-listed',
  },
};
