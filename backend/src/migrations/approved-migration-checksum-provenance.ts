export type ApprovedMigrationChecksumProvenance = {
  migrationName: string;
  checksum: string;
  reviewedLocalChecksum: string;
  sourceImage: string;
  sourceRevision: string;
  verification: string;
};

/**
 * Historical production checksums are accepted only when their exact bytes
 * remain recoverable from an immutable migrator image and the difference from
 * the current migration has been reviewed as non-executable text.
 *
 * Do not add an entry from schema end-state inspection alone. The original SQL
 * bytes must be recoverable so the approval remains independently auditable.
 */
export const APPROVED_MIGRATION_CHECKSUM_PROVENANCE = [
  {
    migrationName: '20260709143000_add_realtime_outbox',
    checksum:
      '3f9705062cd288d93484e62d3afa98e3e5d9190941a9a1d62af8169eafb325a7',
    reviewedLocalChecksum:
      '40baeeddc6f209a7bbd257ba3acf07dad1be43cd34c7212f0457e945c48751c5',
    sourceImage:
      'docker.io/nguyenson1710/foodflow-migrate@sha256:542510dde5c0105fb5e856487cbde851e1fefe2a2a218ca89cbd54f2d737a756',
    sourceRevision: '1f761a65b4a7053858a512bf6eb09a3fd2adbef0',
    verification:
      'Exact image bytes match production; normalized SQL matches current source and differs only by line endings.',
  },
  {
    migrationName: '20260709150000_add_job_outbox',
    checksum:
      '72d4edd8a9a2397e604b38438025670f4b35d8beb7008ff0ae33157df58a7bdf',
    reviewedLocalChecksum:
      'fe1716c645dee3d50df92bce488cdaa2a854ea55e5459e877a8f6087974aeef3',
    sourceImage:
      'docker.io/nguyenson1710/foodflow-migrate@sha256:542510dde5c0105fb5e856487cbde851e1fefe2a2a218ca89cbd54f2d737a756',
    sourceRevision: '1f761a65b4a7053858a512bf6eb09a3fd2adbef0',
    verification:
      'Exact image bytes match production; current source changes only line endings and a non-executable worker-host comment.',
  },
] as const satisfies readonly ApprovedMigrationChecksumProvenance[];

export type ApprovedMigrationChecksumRequirement = {
  appliedChecksum: string;
  reviewedLocalChecksum: string;
};

export type ApprovedMigrationChecksumRequirements = ReadonlyMap<
  string,
  readonly ApprovedMigrationChecksumRequirement[]
>;

export function createApprovedMigrationChecksumRequirements(): ApprovedMigrationChecksumRequirements {
  const requirements = new Map<
    string,
    ApprovedMigrationChecksumRequirement[]
  >();

  for (const provenance of APPROVED_MIGRATION_CHECKSUM_PROVENANCE) {
    const migrationRequirements =
      requirements.get(provenance.migrationName) ?? [];
    migrationRequirements.push({
      appliedChecksum: provenance.checksum,
      reviewedLocalChecksum: provenance.reviewedLocalChecksum,
    });
    requirements.set(provenance.migrationName, migrationRequirements);
  }

  return requirements;
}
