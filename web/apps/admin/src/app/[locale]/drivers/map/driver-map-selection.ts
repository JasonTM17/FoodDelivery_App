import type { DriverLocation } from '@/hooks/use-realtime-driver-locations';

export function findSelectedDriver(
  drivers: DriverLocation[],
  selectedDriverId: string | null,
): DriverLocation | null {
  if (!selectedDriverId) return null;
  return drivers.find(
    (driver) => driver.id === selectedDriverId || driver.driverId === selectedDriverId,
  ) ?? null;
}
