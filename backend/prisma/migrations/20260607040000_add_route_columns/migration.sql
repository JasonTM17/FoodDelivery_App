-- Add route polyline and waypoints to orders for ETA caching and display
ALTER TABLE "orders"
  ADD COLUMN IF NOT EXISTS "route_polyline" TEXT,
  ADD COLUMN IF NOT EXISTS "route_waypoints" JSONB;

-- Add route GeoJSON and traffic duration to delivery_tasks for route persistence
ALTER TABLE "delivery_tasks"
  ADD COLUMN IF NOT EXISTS "route_geojson" JSONB,
  ADD COLUMN IF NOT EXISTS "duration_in_traffic" INTEGER;
