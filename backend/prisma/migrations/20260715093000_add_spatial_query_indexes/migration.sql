-- Back the two production ST_DWithin/ST_Distance query paths with PostGIS
-- indexes. Keep this separate from Storage cleanup so either rollout can be
-- reviewed and recovered independently.
CREATE INDEX IF NOT EXISTS restaurants_location_gist_idx
  ON restaurants USING GIST (location);

CREATE INDEX IF NOT EXISTS driver_location_history_location_gist_idx
  ON driver_location_history USING GIST (location);
