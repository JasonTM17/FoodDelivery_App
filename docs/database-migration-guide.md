# Database Migration Guide

## Prisma Migrations

```bash
# Create migration from schema changes
cd backend
pnpm prisma migrate dev --name describe_your_change

# Apply in production
pnpm prisma migrate deploy

# Generate Prisma client after migration
pnpm prisma generate
```

## PostGIS Spatial Migrations

PostGIS columns use `Unsupported` types in Prisma schema.
Create spatial columns using raw SQL in migration files.

## Table Partitioning

`driver_location_history` should be partitioned monthly for production:

```sql
CREATE TABLE driver_location_history_partitioned (
  LIKE driver_location_history INCLUDING ALL
) PARTITION BY RANGE (recorded_at);

CREATE TABLE dlh_2026_06 PARTITION OF driver_location_history_partitioned
  FOR VALUES FROM ('2026-06-01') TO ('2026-07-01');
```

## Backup & Restore

```bash
# Backup
./infra/scripts/backup-db.sh

# Restore
./infra/scripts/restore-db.sh backups/foodflow_backup_20260604_120000.sql.gz
```
