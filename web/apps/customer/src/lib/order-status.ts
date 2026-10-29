export const ORDER_STATUS_LABELS: Record<string, string> = {
  created: 'Order placed',
  pending_payment: 'Awaiting payment',
  paid: 'Paid',
  restaurant_pending: 'Waiting for restaurant',
  restaurant_accepted: 'Restaurant accepted',
  preparing: 'Preparing',
  ready_for_pickup: 'Ready for pickup',
  driver_assigned: 'Driver assigned',
  driver_arriving_restaurant: 'Driver heading to restaurant',
  picked_up: 'Picked up',
  delivering: 'On the way',
  delivered: 'Delivered',
  completed: 'Completed',
  cancelled: 'Cancelled',
  refunded: 'Refunded',
};

export const ORDER_STATUS_LABELS_VI: Record<string, string> = {
  created: 'Đã đặt đơn',
  pending_payment: 'Chờ thanh toán',
  paid: 'Đã thanh toán',
  restaurant_pending: 'Chờ nhà hàng nhận',
  restaurant_accepted: 'Nhà hàng đã nhận',
  preparing: 'Đang chuẩn bị món',
  ready_for_pickup: 'Món ăn sẵn sàng',
  driver_assigned: 'Đã có tài xế nhận',
  driver_arriving_restaurant: 'Tài xế đang đến quán',
  picked_up: 'Đã lấy món',
  delivering: 'Đang giao hàng',
  delivered: 'Đã giao hàng',
  completed: 'Hoàn thành',
  cancelled: 'Đã hủy',
  refunded: 'Đã hoàn tiền',
};

export const ACTIVE_ORDER_STATUSES = new Set([
  'created',
  'pending_payment',
  'paid',
  'restaurant_pending',
  'restaurant_accepted',
  'preparing',
  'ready_for_pickup',
  'driver_assigned',
  'driver_arriving_restaurant',
  'picked_up',
  'delivering',
]);

export const LIVE_TRACKING_STATUSES = new Set([
  'driver_assigned',
  'driver_arriving_restaurant',
  'picked_up',
  'delivering',
]);

// Customer cancellation rights per the backend order state machine.
export const CUSTOMER_CANCELLABLE_STATUSES = new Set([
  'created',
  'pending_payment',
  'paid',
  'restaurant_pending',
]);

// Customer may confirm receipt once the driver marked delivery complete.
export const CUSTOMER_COMPLETABLE_STATUSES = new Set(['delivered']);

export const REVIEWABLE_STATUSES = new Set(['delivered', 'completed']);

export type StatusTone = 'neutral' | 'info' | 'warning' | 'success' | 'danger';

const ORDER_STATUS_TONES: Record<string, StatusTone> = {
  created: 'neutral',
  pending_payment: 'warning',
  paid: 'info',
  restaurant_pending: 'warning',
  restaurant_accepted: 'info',
  preparing: 'warning',
  ready_for_pickup: 'info',
  driver_assigned: 'info',
  driver_arriving_restaurant: 'info',
  picked_up: 'info',
  delivering: 'info',
  delivered: 'success',
  completed: 'success',
  cancelled: 'danger',
  refunded: 'danger',
};

export interface OrderStatusMeta {
  label: string;
  tone: StatusTone;
}

export function orderStatusMeta(status: string, locale?: string): OrderStatusMeta {
  return {
    label: orderStatusLabel(status, locale),
    tone: ORDER_STATUS_TONES[status] ?? 'neutral',
  };
}

export const PROGRESS_STEPS = ['Placed', 'Accepted', 'Preparing', 'On the way', 'Delivered'] as const;

const STATUS_PROGRESS_INDEX: Record<string, number> = {
  created: 0,
  pending_payment: 0,
  paid: 0,
  restaurant_pending: 0,
  restaurant_accepted: 1,
  preparing: 2,
  ready_for_pickup: 3,
  driver_assigned: 3,
  driver_arriving_restaurant: 3,
  picked_up: 3,
  delivering: 3,
  delivered: 4,
  completed: 4,
};

export function orderProgressStep(status: string): number {
  return STATUS_PROGRESS_INDEX[status] ?? 0;
}

/** Whether /orders/:id/tracking is expected to return live driver data. */
export function isTrackingRelevant(status: string): boolean {
  return ACTIVE_ORDER_STATUSES.has(status);
}

export function orderStatusLabel(status: string, locale?: string): string {
  if (locale === 'vi') {
    return ORDER_STATUS_LABELS_VI[status] ?? ORDER_STATUS_LABELS[status] ?? status.replace(/_/g, ' ');
  }
  return ORDER_STATUS_LABELS[status] ?? status.replace(/_/g, ' ');
}

export function isActiveOrder(status: string): boolean {
  return ACTIVE_ORDER_STATUSES.has(status);
}

export function isLiveTrackingStatus(status: string): boolean {
  return LIVE_TRACKING_STATUSES.has(status);
}

export function statusBadgeClass(status: string): string {
  switch (status) {
    case 'delivered':
    case 'completed':
      return 'bg-emerald-100 text-emerald-800 border-emerald-200';
    case 'cancelled':
    case 'refunded':
      return 'bg-red-100 text-red-800 border-red-200';
    case 'delivering':
    case 'picked_up':
    case 'driver_assigned':
    case 'driver_arriving_restaurant':
      return 'bg-sky-100 text-sky-800 border-sky-200';
    case 'preparing':
    case 'ready_for_pickup':
    case 'restaurant_accepted':
      return 'bg-amber-100 text-amber-800 border-amber-200';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200';
  }
}
