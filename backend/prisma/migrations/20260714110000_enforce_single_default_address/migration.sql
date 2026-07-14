BEGIN;

-- Block address writes across the cleanup/index gap so a concurrent insert
-- cannot recreate a duplicate default before the invariant exists.
LOCK TABLE addresses IN SHARE ROW EXCLUSIVE MODE;

-- Preserve the newest default in case legacy data already contains duplicates.
WITH ranked_defaults AS (
  SELECT
    id,
    ROW_NUMBER() OVER (
      PARTITION BY user_id
      ORDER BY created_at DESC, id DESC
    ) AS row_number
  FROM addresses
  WHERE is_default = TRUE
)
UPDATE addresses
SET is_default = FALSE
FROM ranked_defaults
WHERE addresses.id = ranked_defaults.id
  AND ranked_defaults.row_number > 1;

-- Application transactions lock the user row before changing a default. The
-- partial unique index keeps the invariant true for every caller and migration.
CREATE UNIQUE INDEX "addresses_one_default_per_user_key"
  ON addresses (user_id)
  WHERE is_default = TRUE;

COMMIT;
