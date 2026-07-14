-- Keep the database default aligned with the Prisma Address id contract.
ALTER TABLE addresses
  ALTER COLUMN id SET DEFAULT gen_random_uuid();
