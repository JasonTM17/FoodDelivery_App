/**
 * Mirrors the backend OrderStateMachine driver role transitions:
 *   driver_assigned → driver_arriving_restaurant → picked_up → delivering → delivered
 */
export const DRIVER_NEXT_STATUS: Record<string, string> = {
  driver_assigned: 'driver_arriving_restaurant',
  driver_arriving_restaurant: 'picked_up',
  picked_up: 'delivering',
  delivering: 'delivered',
};

export const DRIVER_NEXT_ACTION_LABEL: Record<string, string> = {
  driver_assigned: 'Head to restaurant',
  driver_arriving_restaurant: 'Confirm pickup',
  picked_up: 'Start delivery',
  delivering: 'Confirm delivery',
};

export const DRIVER_STATUS_LABELS: Record<string, string> = {
  driver_assigned: 'Assigned',
  driver_arriving_restaurant: 'Heading to restaurant',
  picked_up: 'Picked up',
  delivering: 'Delivering',
  delivered: 'Delivered',
  completed: 'Completed',
  cancelled: 'Cancelled',
  refunded: 'Refunded',
};

export function nextDriverStatus(status: string): string | null {
  return DRIVER_NEXT_STATUS[status] ?? null;
}

export function nextDriverActionLabel(status: string): string | null {
  return DRIVER_NEXT_ACTION_LABEL[status] ?? null;
}

export function driverStatusLabel(status: string): string {
  return DRIVER_STATUS_LABELS[status] ?? status.replace(/_/g, ' ');
}

export function isActiveDriverStatus(status: string): boolean {
  return status in DRIVER_NEXT_STATUS;
}
