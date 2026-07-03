import type { DriverLocation } from '@/hooks/use-realtime-driver-locations';

export interface DriverMarkerCopy {
  rating: string;
  status: string;
  order: string;
  vehicle: string;
  lastSeen: string;
}

export function buildDriverInfoWindowHtml(
  driver: DriverLocation,
  statusLabel: string,
  copy: DriverMarkerCopy,
): string {
  const rows = [
    [copy.rating, driver.rating.toFixed(1)],
    [copy.status, statusLabel],
    driver.vehicleType ? [copy.vehicle, driver.vehicleType] : null,
    [copy.lastSeen, new Date(driver.lastSeenAt).toLocaleTimeString()],
    driver.currentOrder ? [copy.order, driver.currentOrder] : null,
  ].filter((row): row is [string, string] => Boolean(row));

  return [
    '<div style="min-width:200px;padding:10px;font-size:13px;line-height:1.45">',
    `<strong>${escapeHtml(driver.name)}</strong>`,
    ...rows.map(([label, value]) => (
      `<div><span style="color:#64748b">${escapeHtml(label)}:</span> ${escapeHtml(value)}</div>`
    )),
    '</div>',
  ].join('');
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
